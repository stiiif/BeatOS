import { BaseComponent } from '../BaseComponent.js';
import { NUM_LFOS, TRACKS_PER_GROUP } from '../../config/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../config/events.js';
import { SearchModal } from '../library/SearchModal.js'; 

export class Inspector extends BaseComponent {
    constructor(containerSelector, trackManager) {
        super(containerSelector);
        this.trackManager = trackManager;
        this.currentTrackId = 0;
        this.selectedLfoIndex = 0;
        
        // Initialize Search Modal
        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
        }

        this.initUI();
        this.initEvents();
    }

    initUI() {
        // Cache DOM elements that exist in the static HTML (right pane)
        // We are assuming the static HTML structure of the inspector is still largely intact in index.html
        // or we would rebuild it entirely here. For Phase 3 migration, we attach to existing IDs.
        
        this.els = {
            num: document.getElementById('currentTrackNum'),
            grpLabel: document.getElementById('trackGroupLabel'),
            indicator: document.getElementById('trackIndicator'),
            typeLabel: document.getElementById('trackTypeLabel'),
            
            // Containers
            headerCustom: document.querySelector('.right-pane .p-3.bg-neutral-800'),
            granularControls: document.getElementById('granularControls'),
            simpleDrumControls: document.getElementById('simpleDrumControls'),
            automationControls: document.getElementById('automationControls'),
            lfoSection: document.getElementById('lfoSection'),
            lfoTabs: document.getElementById('lfoTabsContainer'),
            
            // Knobs
            sliders: document.querySelectorAll('.param-slider'),
            
            // LFO
            lfoTarget: document.getElementById('lfoTarget'),
            lfoWave: document.getElementById('lfoWave'),
            lfoRate: document.getElementById('lfoRate'),
            lfoAmt: document.getElementById('lfoAmt'),
            lfoRateVal: document.getElementById('lfoRateVal'),
            lfoAmtVal: document.getElementById('lfoAmtVal')
        };

        this.bindControls();
        this.renderLfoTabs();
    }

    initEvents() {
        globalBus.on(EVENTS.TRACK_SELECTED, (id) => {
            this.currentTrackId = id;
            this.refresh();
        });

        // Update when params change externally (randomization)
        globalBus.on(EVENTS.PARAM_CHANGED, (data) => {
            if (!data || data.track === this.currentTrackId) {
                this.updateKnobVisuals();
            }
        });

        globalBus.on(EVENTS.LFO_CHANGED, (data) => {
            if (!data || data.track === this.currentTrackId) {
                this.updateLfoVisuals();
            }
        });
        
        // Update when choke groups change to update header color/label
        globalBus.on(EVENTS.CHOKE_GROUP_UPDATED, () => {
            this.refresh();
        });
    }

    bindControls() {
        // Sliders
        this.els.sliders.forEach(el => {
            el.addEventListener('input', (e) => {
                const t = this.getTrack();
                if (!t) return;
                const param = e.target.dataset.param;
                t.params[param] = parseFloat(e.target.value);
                this.updateKnobLabel(e.target, t.params[param], param);
                
                // Real-time update for granular engine
                if (t.type === 'granular') globalBus.emit(EVENTS.VISUALIZER_UPDATE); 
            });
        });

        // LFO
        if(this.els.lfoTarget) this.els.lfoTarget.addEventListener('change', e => { 
            this.getTrack().lfos[this.selectedLfoIndex].target = e.target.value; 
        });
        if(this.els.lfoWave) this.els.lfoWave.addEventListener('change', e => { 
            this.getTrack().lfos[this.selectedLfoIndex].wave = e.target.value; 
        });
        if(this.els.lfoRate) this.els.lfoRate.addEventListener('input', e => { 
            const v = parseFloat(e.target.value); 
            this.getTrack().lfos[this.selectedLfoIndex].rate = v; 
            if(this.els.lfoRateVal) this.els.lfoRateVal.innerText = v.toFixed(1); 
        });
        if(this.els.lfoAmt) this.els.lfoAmt.addEventListener('input', e => { 
            const v = parseFloat(e.target.value); 
            this.getTrack().lfos[this.selectedLfoIndex].amount = v; 
            if(this.els.lfoAmtVal) this.els.lfoAmtVal.innerText = v.toFixed(2); 
        });
    }

    getTrack() {
        return this.trackManager.tracks[this.currentTrackId];
    }

    refresh() {
        const t = this.getTrack();
        if(!t) return;

        const groupIdx = Math.floor(this.currentTrackId / TRACKS_PER_GROUP);
        // Check for random choke mode override
        const chokeInfo = this.trackManager.getRandomChokeInfo();
        const displayGroup = chokeInfo.mode ? chokeInfo.groups[this.currentTrackId] : groupIdx;
        
        const groupColor = `hsl(${displayGroup * 45}, 70%, 50%)`;

        // Update Header Info
        if(this.els.num) this.els.num.innerText = (this.currentTrackId + 1).toString().padStart(2, '0');
        if(this.els.grpLabel) {
            this.els.grpLabel.innerText = `GRP ${displayGroup}`;
            this.els.grpLabel.style.color = groupColor;
        }
        if(this.els.indicator) {
            this.els.indicator.style.backgroundColor = groupColor;
            this.els.indicator.style.boxShadow = `0 0 8px hsla(${displayGroup * 45}, 70%, 50%, 0.4)`;
        }

        this.updateControlsVisibility(t);
        this.updateKnobVisuals(t);
        this.updateLfoVisuals(t);
        
        // Re-render the dynamic header (Type buttons, etc)
        // Ideally this would be a sub-component, but migrating logic here:
        this.renderDynamicHeader(t, groupColor);
    }

    updateControlsVisibility(t) {
        if(!t) return;
        this.els.granularControls.classList.add('hidden');
        this.els.simpleDrumControls.classList.add('hidden');
        this.els.automationControls.classList.add('hidden');
        this.els.lfoSection.classList.add('hidden');

        if (t.type === 'automation') {
            this.els.automationControls.classList.remove('hidden');
        } else if (t.type === 'simple-drum') {
            this.els.simpleDrumControls.classList.remove('hidden');
        } else {
            this.els.granularControls.classList.remove('hidden');
            this.els.lfoSection.classList.remove('hidden');
        }
    }

    updateKnobVisuals(track = this.getTrack()) {
        if(!track) return;
        this.els.sliders.forEach(el => {
            const param = el.dataset.param;
            if (track.params[param] !== undefined) {
                el.value = track.params[param];
                this.updateKnobLabel(el, track.params[param], param);
            }
        });
    }

    updateKnobLabel(el, value, param) {
        let suffix = '';
        if(param === 'density') suffix = 'hz';
        if(param === 'grainSize') suffix = 's';
        if(param === 'pitch') suffix = 'x';
        if(param === 'overlap') suffix = 'x';
        if(el.nextElementSibling) {
            el.nextElementSibling.innerText = value.toFixed(2) + suffix;
        }
    }

    renderLfoTabs() {
        if (!this.els.lfoTabs) return;
        this.els.lfoTabs.innerHTML = '';
        for(let i=0; i<NUM_LFOS; i++) {
            const btn = document.createElement('button');
            btn.className = 'lfo-tab flex-1 text-[10px] font-bold py-1 rounded transition text-neutral-400 hover:bg-neutral-700 min-w-[40px]';
            btn.innerText = `LFO ${i+1}`;
            btn.onclick = () => {
                this.selectedLfoIndex = i;
                this.updateLfoVisuals();
            };
            this.els.lfoTabs.appendChild(btn);
        }
    }

    updateLfoVisuals(track = this.getTrack()) {
        if(!track) return;
        
        // Tab Highlighting
        Array.from(this.els.lfoTabs.children).forEach((btn, idx) => {
            if(idx === this.selectedLfoIndex) {
                btn.classList.add('text-white', 'bg-neutral-700');
                btn.classList.remove('text-neutral-400');
            } else {
                btn.classList.remove('text-white', 'bg-neutral-700');
                btn.classList.add('text-neutral-400');
            }
        });

        const lfo = track.lfos[this.selectedLfoIndex];
        if(this.els.lfoTarget) this.els.lfoTarget.value = lfo.target;
        if(this.els.lfoWave) this.els.lfoWave.value = lfo.wave;
        if(this.els.lfoRate) this.els.lfoRate.value = lfo.rate;
        if(this.els.lfoAmt) this.els.lfoAmt.value = lfo.amount;
        if(this.els.lfoRateVal) this.els.lfoRateVal.innerText = lfo.rate.toFixed(1);
        if(this.els.lfoAmtVal) this.els.lfoAmtVal.innerText = lfo.amount.toFixed(2);
    }

    renderDynamicHeader(t, groupColor) {
        // Logic adapted from old TrackInspector to rebuild the small header area
        // with Type buttons (Kick, Snare, 909, etc) and Choke Group buttons
        const container = this.els.headerCustom;
        if(!container) return;
        container.innerHTML = '';
        container.className = 'p-3 bg-neutral-800 border-b border-neutral-700 flex flex-col gap-2';

        // Row 1: Name & Search
        const row1 = document.createElement('div');
        row1.className = 'flex items-center gap-2 w-full';
        
        // Indicator
        const indicator = document.createElement('span');
        indicator.className = 'w-3 h-3 rounded-full transition-colors duration-200 shrink-0';
        indicator.style.backgroundColor = groupColor;
        row1.appendChild(indicator);

        // Name
        const nameSpan = document.createElement('span');
        let nameText = `Track ${(this.currentTrackId + 1).toString().padStart(2,'0')}`;
        if (t.customSample) nameText = t.customSample.name;
        else if (t.type === 'simple-drum') nameText = (t.params.drumType || 'Drum').toUpperCase();
        else if (t.autoName) nameText = t.autoName;
        
        nameSpan.innerText = nameText;
        nameSpan.className = 'text-xs text-neutral-300 truncate flex-1 font-bold';
        nameSpan.title = nameText;
        row1.appendChild(nameSpan);

        // Search Button
        const searchBtn = document.createElement('button');
        searchBtn.className = 'text-[10px] bg-emerald-900/30 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-900/50 ml-2';
        searchBtn.innerHTML = '<i class="fas fa-search mr-1"></i>Find';
        searchBtn.onclick = () => this.searchModal && this.searchModal.open(t, nameText);
        row1.appendChild(searchBtn);
        
        container.appendChild(row1);

        // Row 2: Type Selectors (Quick load)
        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const types = [
            { lbl: 'KICK', type: 'kick' },
            { lbl: 'SNR', type: 'snare' },
            { lbl: 'HAT', type: 'hihat' },
            { lbl: 'FM', type: 'texture' },
            { lbl: '909', type: '909', cls: 'bg-orange-900/30 text-orange-400 border-orange-900/50' },
            { lbl: 'AUTO', type: 'auto', cls: 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50' }
        ];

        types.forEach(item => {
            const btn = document.createElement('button');
            btn.innerText = item.lbl;
            const cls = item.cls || 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300';
            btn.className = `text-[9px] font-bold ${cls} px-1.5 py-1 rounded transition border border-neutral-600 flex-1 text-center`;
            btn.onclick = () => this.handleTypeChange(item.type);
            row2.appendChild(btn);
        });
        container.appendChild(row2);
        
        // Row 3: Choke Groups
        const row3 = document.createElement('div');
        row3.className = 'flex gap-0.5 w-full items-center';
        const lbl = document.createElement('span');
        lbl.innerText = 'CHK';
        lbl.className = 'text-[9px] font-bold text-neutral-500 mr-1';
        row3.appendChild(lbl);
        
        for(let i=1; i<=8; i++) {
            const btn = document.createElement('button');
            const isActive = t.chokeGroup === i;
            const bg = isActive ? 'bg-red-600 text-white border-red-700' : 'bg-neutral-800 text-neutral-500 border-neutral-700';
            btn.className = `flex-1 h-4 text-[8px] border rounded flex items-center justify-center hover:bg-neutral-700 transition ${bg}`;
            btn.innerText = i;
            btn.onclick = () => {
                t.chokeGroup = isActive ? 0 : i;
                this.renderDynamicHeader(t, groupColor); // re-render to show state
            };
            row3.appendChild(btn);
        }
        container.appendChild(row3);
    }

    handleTypeChange(type) {
        const t = this.getTrack();
        const ae = this.trackManager.audioEngine;
        
        if (type === 'auto') {
            t.type = 'automation';
            t.steps.fill(0);
            globalBus.emit(EVENTS.TRACK_UPDATED, { trackId: t.id });
        } else if (type === '909') {
            t.type = 'simple-drum';
            t.params.drumType = 'kick';
        } else {
            t.type = 'granular';
            const buf = ae.generateBufferByType(type);
            if (buf) {
                t.buffer = buf;
                t.rmsMap = ae.analyzeBuffer(buf);
            }
        }
        this.refresh();
        globalBus.emit(EVENTS.VISUALIZER_UPDATE);
    }
}