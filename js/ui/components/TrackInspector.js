import { NUM_LFOS, TRACKS_PER_GROUP } from '../../utils/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../events/Events.js';
import { SearchModal } from '../SearchModal.js';

export class TrackInspector {
    constructor(containerSelector, trackManager) {
        this.container = document.querySelector(containerSelector);
        this.trackManager = trackManager;
        this.tracks = trackManager.getTracks();
        this.currentTrackIndex = 0;
        this.selectedLfoIndex = 0;
        
        // Initialize Search Modal (Inspector owns the search trigger)
        // Ideally SearchModal should be its own service/component, but for now we keep it close.
        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
        }

        this.initEvents();
        
        // Initial setup for static listeners (sliders, buttons that exist in HTML)
        this.bindStaticControls();
    }

    initEvents() {
        globalBus.on(EVENTS.TRACK_SELECTED, (index) => {
            this.currentTrackIndex = index;
            this.updateUI();
        });
        
        // Listen for updates that might affect the inspector (e.g. randomizations)
        globalBus.on(EVENTS.PARAM_CHANGED, () => this.updateKnobs());
        globalBus.on(EVENTS.LFO_CHANGED, () => this.updateLfoUI());
    }

    bindStaticControls() {
        // --- Slider Inputs ---
        const sliders = this.container.querySelectorAll('.param-slider');
        sliders.forEach(el => {
            el.addEventListener('input', (e) => {
                const t = this.tracks[this.currentTrackIndex];
                if (!t) return;
                const param = e.target.dataset.param;
                t.params[param] = parseFloat(e.target.value);
                
                // Update label immediately
                this.updateKnobLabel(e.target, t.params[param], param);
                
                // Emit event (Visualizer might listen to this)
                globalBus.emit(EVENTS.PARAM_CHANGED, { track: this.currentTrackIndex, param, value: t.params[param] });
            });
        });

        // --- LFO Tabs ---
        // These are dynamically generated, so we bind to container or regenerate.
        // We'll regenerate in updateUI or init.
        
        // --- LFO Controls ---
        const lfoTarget = document.getElementById('lfoTarget');
        const lfoWave = document.getElementById('lfoWave');
        const lfoRate = document.getElementById('lfoRate');
        const lfoAmt = document.getElementById('lfoAmt');

        if(lfoTarget) lfoTarget.addEventListener('change', e => { 
            this.tracks[this.currentTrackIndex].lfos[this.selectedLfoIndex].target = e.target.value; 
            globalBus.emit(EVENTS.LFO_CHANGED);
        });
        if(lfoWave) lfoWave.addEventListener('change', e => { 
            this.tracks[this.currentTrackIndex].lfos[this.selectedLfoIndex].wave = e.target.value; 
            globalBus.emit(EVENTS.LFO_CHANGED);
        });
        if(lfoRate) lfoRate.addEventListener('input', e => { 
            const v = parseFloat(e.target.value); 
            this.tracks[this.currentTrackIndex].lfos[this.selectedLfoIndex].rate = v; 
            document.getElementById('lfoRateVal').innerText = v.toFixed(1); 
            globalBus.emit(EVENTS.LFO_CHANGED);
        });
        if(lfoAmt) lfoAmt.addEventListener('input', e => { 
            const v = parseFloat(e.target.value); 
            this.tracks[this.currentTrackIndex].lfos[this.selectedLfoIndex].amount = v; 
            document.getElementById('lfoAmtVal').innerText = v.toFixed(2); 
            globalBus.emit(EVENTS.LFO_CHANGED);
        });

        // --- Automation Speed ---
        const autoSpeedSel = document.getElementById('autoSpeedSelect');
        if(autoSpeedSel) {
            autoSpeedSel.addEventListener('change', (e) => {
                const t = this.tracks[this.currentTrackIndex];
                if(t && t.type === 'automation') {
                    t.clockDivider = parseInt(e.target.value);
                }
            });
        }

        // --- Drum Type Selectors ---
        document.querySelectorAll('.drum-sel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const t = this.tracks[this.currentTrackIndex];
                if (t.type === 'simple-drum') {
                    t.params.drumType = e.target.dataset.drum;
                    this.updateControlsVisibility();
                }
            });
        });
        
        // --- Sound Generator Buttons ---
        document.querySelectorAll('.sound-gen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSoundGenerator(e.target.dataset.type, e.target);
            });
        });
        
        // --- Specific Buttons ---
        const load909Btn = document.getElementById('load909Btn');
        if(load909Btn) load909Btn.addEventListener('click', () => this.setTrackType('simple-drum'));
        
        const loadAutoBtn = document.getElementById('loadAutoBtn');
        if(loadAutoBtn) loadAutoBtn.addEventListener('click', () => this.setTrackType('automation'));
        
        const resetParamBtn = document.getElementById('resetParamBtn');
        if(resetParamBtn) resetParamBtn.addEventListener('click', () => this.resetParameters());
        
        const randomizeBtn = document.getElementById('randomizeBtn');
        if(randomizeBtn) randomizeBtn.addEventListener('click', () => this.randomizeCurrentTrackParams());
        
        const randModsBtn = document.getElementById('randModsBtn');
        if(randModsBtn) randModsBtn.addEventListener('click', () => {
            const t = this.tracks[this.currentTrackIndex];
            if (t.type === 'granular') this.trackManager.randomizeTrackModulators(t);
            this.updateLfoUI();
        });
        
        // --- Sample Loading ---
        const loadSampleBtnInline = document.getElementById('loadSampleBtnInline');
        const sampleInput = document.getElementById('sampleInput');
        if(loadSampleBtnInline && sampleInput) {
            loadSampleBtnInline.addEventListener('click', () => {
                if (!this.tracks || this.tracks.length === 0 || !this.trackManager.audioEngine.getContext()) { 
                    alert('Init Audio First'); return; 
                }
                sampleInput.click();
            });
            sampleInput.addEventListener('change', async (e) => {
                this.handleSampleUpload(e.target.files[0], loadSampleBtnInline);
                e.target.value = ''; // Reset input
            });
        }
    }

    updateUI() {
        const t = this.tracks[this.currentTrackIndex];
        if(!t) return;

        // 1. Update Header
        const grp = Math.floor(this.currentTrackIndex / TRACKS_PER_GROUP);
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        this.updateHeader(t, grp, groupColor);

        // 2. Update Controls Visibility
        this.updateControlsVisibility();

        // 3. Update Knobs/Sliders
        this.updateKnobs();

        // 4. Update LFOs
        this.updateLfoUI();
        
        // 5. Update Colors
        this.updateColors(groupColor);
    }

    updateHeader(t, groupIdx, groupColor) {
        // Find existing header elements or container
        // Note: The HTML structure is a bit rigid in the original code. 
        // We will target specific IDs if they exist, or the container.
        
        // Update Track Number
        const displayNum = this.currentTrackIndex + 1;
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;

        // Update Group Label
        const grpLbl = document.getElementById('trackGroupLabel');
        if(grpLbl) {
            grpLbl.innerText = `GRP ${groupIdx}`;
            grpLbl.style.color = groupColor;
        }

        // Update Indicator
        const indicator = document.getElementById('trackIndicator');
        if(indicator) {
            indicator.style.backgroundColor = groupColor;
            indicator.style.boxShadow = `0 0 8px hsla(${groupIdx * 45}, 70%, 50%, 0.4)`;
        }

        // Redraw Custom Header Content (Track Name, Type, Search Button, Choke Groups)
        // Ideally this should be cleaner, but we are replicating UIManager logic
        this.renderDynamicHeaderContent(t, groupIdx, groupColor);
    }

    renderDynamicHeaderContent(t, groupIdx, groupColor) {
        let container = document.querySelector('.right-pane .p-3.bg-neutral-800');
        if (!container) return;

        // Clear and Rebuild (keeping it simple as per original design)
        container.innerHTML = '';
        container.className = 'p-3 bg-neutral-800 border-b border-neutral-700 flex flex-col gap-2';

        const displayNum = this.currentTrackIndex + 1 < 10 ? `0${this.currentTrackIndex + 1}` : this.currentTrackIndex + 1;
        let trackName = `Track ${displayNum}`;
        let trackType = 'Synth';
        
        if (t.customSample) {
            trackName = t.customSample.name;
            trackType = 'Sample';
        } else if (t.type === 'simple-drum') {
            trackName = (t.params.drumType || 'Kick').toUpperCase();
            trackType = '909';
        } else if (t.type === 'automation') {
            trackName = 'Automation';
            trackType = 'Auto';
        } else {
            trackName = 'Granular';
            trackType = 'Synth';
        }

        // ROW 1
        const row1 = document.createElement('div');
        row1.className = 'flex items-center gap-2 w-full';
        
        const indicator = document.createElement('span');
        indicator.id = 'trackIndicator'; // Re-adding ID for reference
        indicator.className = 'w-3 h-3 rounded-full transition-colors duration-200 shrink-0';
        indicator.style.backgroundColor = groupColor;
        row1.appendChild(indicator);

        const numSpan = document.createElement('span');
        numSpan.id = 'currentTrackNum';
        numSpan.innerText = displayNum;
        numSpan.className = 'text-sm font-bold text-white font-mono';
        row1.appendChild(numSpan);

        const nameSpan = document.createElement('span');
        nameSpan.innerText = trackName;
        nameSpan.className = 'text-xs text-neutral-300 truncate flex-1';
        nameSpan.title = trackName;
        row1.appendChild(nameSpan);

        const typeLabel = document.createElement('span');
        typeLabel.id = 'trackTypeLabel';
        typeLabel.innerText = `[${trackType}]`;
        typeLabel.className = 'text-[10px] text-neutral-500 font-mono uppercase';
        row1.appendChild(typeLabel);

        const searchBtn = document.createElement('button');
        searchBtn.className = 'text-[10px] bg-emerald-900/30 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-900/50 ml-2';
        searchBtn.innerHTML = '<i class="fas fa-search mr-1"></i>Find';
        searchBtn.onclick = () => {
            if (this.searchModal) {
                let query = "";
                if (t.type === 'simple-drum') query = t.params.drumType || "drum";
                else if (t.customSample) query = t.customSample.name.replace('.wav', '').replace('.mp3', '');
                else if (t.autoName) query = t.autoName;
                else query = "drum hit";
                this.searchModal.open(t, query);
            }
        };
        row1.appendChild(searchBtn);
        container.appendChild(row1);

        // ROW 2: Type Buttons
        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const rstBtn = document.createElement('button');
        rstBtn.id = 'resetParamBtn'; // ID re-added
        rstBtn.className = 'text-[9px] bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 min-w-[24px]';
        rstBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rstBtn.onclick = () => this.resetParameters();
        row2.appendChild(rstBtn);

        const createTypeBtn = (label, type, colorClass = 'bg-neutral-700', is909 = false, isAuto = false) => {
            const btn = document.createElement('button');
            btn.innerText = label;
            btn.className = `text-[9px] font-bold ${colorClass} hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 flex-1 text-center`;
            btn.onclick = () => {
                if(label === 'SMP') {
                    const sampleInput = document.getElementById('sampleInput');
                    if(sampleInput) sampleInput.click();
                } else if(isAuto) {
                    this.setTrackType('automation');
                } else if(is909) {
                    this.setTrackType('simple-drum');
                } else {
                    this.handleSoundGenerator(type);
                }
            };
            return btn;
        };

        row2.appendChild(createTypeBtn('KICK', 'kick'));
        row2.appendChild(createTypeBtn('SNR', 'snare'));
        row2.appendChild(createTypeBtn('HAT', 'hihat'));
        row2.appendChild(createTypeBtn('FM', 'texture'));
        row2.appendChild(createTypeBtn('SMP', null, 'bg-sky-900/30 text-sky-400 border-sky-900/50'));
        row2.appendChild(createTypeBtn('909', null, 'bg-orange-900/30 text-orange-400 border-orange-900/50', true));
        row2.appendChild(createTypeBtn('AUTO', null, 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50', false, true));

        container.appendChild(row2);

        // ROW 3: Choke Groups
        const row3 = document.createElement('div');
        row3.className = 'flex gap-0.5 w-full';
        const grpLabel = document.createElement('span');
        grpLabel.innerText = 'CHK';
        grpLabel.className = 'text-[9px] font-bold text-neutral-500 mr-1 flex items-center';
        row3.appendChild(grpLabel);

        for(let i=0; i<8; i++) {
            const btn = document.createElement('button');
            const targetGroup = i + 1;
            const isAssigned = t.chokeGroup === targetGroup;
            const bgClass = isAssigned ? '' : 'bg-neutral-800 text-neutral-500';
            const style = isAssigned ? `background-color: #ef4444; color: #fff; border-color: #b91c1c;` : '';
            btn.className = `flex-1 h-4 text-[8px] border border-neutral-700 rounded flex items-center justify-center hover:bg-neutral-700 transition ${bgClass}`;
            btn.style.cssText = style;
            btn.innerText = targetGroup;
            btn.onclick = () => {
                t.chokeGroup = (t.chokeGroup === targetGroup) ? 0 : targetGroup;
                this.updateHeader(t, groupIdx, groupColor); // Refresh header to show change
            };
            row3.appendChild(btn);
        }
        container.appendChild(row3);
    }

    updateControlsVisibility() {
        const t = this.tracks[this.currentTrackIndex];
        if (!t) return;

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const lfoSection = document.getElementById('lfoSection');
        const speedSel = document.getElementById('autoSpeedSelect');

        if(granularControls) granularControls.classList.add('hidden');
        if(drumControls) drumControls.classList.add('hidden');
        if(lfoSection) lfoSection.classList.add('hidden');
        if(autoControls) autoControls.classList.add('hidden');

        if (t.type === 'automation') {
            if(autoControls) autoControls.classList.remove('hidden');
            if(speedSel) speedSel.value = t.clockDivider || 1;
        } 
        else if (t.type === 'simple-drum') {
            if(drumControls) drumControls.classList.remove('hidden');
            document.querySelectorAll('.drum-sel-btn').forEach(btn => {
                if (btn.dataset.drum === t.params.drumType) {
                    btn.classList.replace('text-neutral-400', 'text-white');
                    btn.classList.replace('bg-neutral-800', 'bg-orange-700');
                } else {
                    btn.classList.replace('text-white', 'text-neutral-400');
                    btn.classList.replace('bg-orange-700', 'bg-neutral-800');
                }
            });
        }
        else {
            if(granularControls) granularControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            // Trigger resize for canvas if needed
            setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        }
    }

    updateKnobs() {
        const t = this.tracks[this.currentTrackIndex];
        if(!t) return;
        this.container.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                this.updateKnobLabel(el, t.params[param], param);
            }
        });
    }

    updateKnobLabel(inputEl, value, param) {
        let suffix = '';
        if(param === 'density') suffix = 'hz';
        if(param === 'grainSize') suffix = 's';
        if(param === 'pitch') suffix = 'x';
        if(param === 'overlap') suffix = 'x';
        if(inputEl.nextElementSibling) {
            inputEl.nextElementSibling.innerText = value.toFixed(2) + suffix;
        }
    }

    updateLfoUI() {
        // Regenerate Tabs if needed (simple check if container is empty)
        const container = document.getElementById('lfoTabsContainer');
        if (container && container.children.length === 0) {
            for(let i=0; i<NUM_LFOS; i++) {
                const btn = document.createElement('button');
                btn.className = 'lfo-tab flex-1 text-[10px] font-bold py-1 rounded transition text-neutral-400 hover:bg-neutral-700 min-w-[40px]';
                btn.dataset.lfo = i;
                btn.innerText = `LFO ${i+1}`;
                btn.addEventListener('click', (e) => {
                    this.selectedLfoIndex = parseInt(e.target.dataset.lfo);
                    this.updateLfoUI();
                });
                container.appendChild(btn);
            }
        }

        const t = this.tracks[this.currentTrackIndex];
        if(!t) return;
        const lfo = t.lfos[this.selectedLfoIndex];
        
        // Highlight active tab
        const normalGrp = Math.floor(this.currentTrackIndex / TRACKS_PER_GROUP);
        const groupColorDark = `hsl(${normalGrp * 45}, 70%, 35%)`;
        
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if(i === this.selectedLfoIndex) {
                b.classList.remove('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.add('text-white');
                b.style.backgroundColor = groupColorDark;
            } else {
                b.classList.add('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.remove('text-white');
                b.style.backgroundColor = '';
            }
        });
        
        const rateVal = document.getElementById('lfoRateVal');
        const amtVal = document.getElementById('lfoAmtVal');
        
        document.getElementById('lfoTarget').value = lfo.target;
        document.getElementById('lfoWave').value = lfo.wave;
        document.getElementById('lfoRate').value = lfo.rate;
        if(rateVal) rateVal.innerText = lfo.rate.toFixed(1);
        document.getElementById('lfoAmt').value = lfo.amount;
        if(amtVal) amtVal.innerText = lfo.amount.toFixed(2);
    }

    updateColors(groupColor) {
        // Update any specific color dependent elements in the Inspector
        // Note: Track header indicator logic handles most of this.
        // We can update slider thumbs if we want, but CSS handles variables better.
        this.container.style.setProperty('--group-color', groupColor);
        this.container.style.setProperty('--group-color-glow', `hsla(${Math.floor(this.currentTrackIndex/TRACKS_PER_GROUP)*45}, 70%, 50%, 0.4)`);
    }

    // --- Action Handlers ---

    setTrackType(type) {
        const t = this.tracks[this.currentTrackIndex];
        
        if (type === 'automation') {
            t.type = 'automation';
            t.steps.fill(0);
            // Notify Grid to reset visuals
            globalBus.emit(EVENTS.PATTERN_CLEARED, this.currentTrackIndex); // Or generic update
            globalBus.emit(EVENTS.TRACK_UPDATED, this.currentTrackIndex);
        } else if (type === 'simple-drum') {
            t.type = 'simple-drum';
            t.params.drumType = 'kick'; t.params.drumTune = 0.5; t.params.drumDecay = 0.5;
        }
        
        this.updateUI();
        // Force visualizer refresh
        globalBus.emit(EVENTS.VISUALIZER_UPDATE);
    }

    handleSoundGenerator(type, btnElement) {
        if (!this.trackManager || !this.trackManager.audioEngine) return;
        const ae = this.trackManager.audioEngine;
        if (!ae.getContext()) return;

        const t = this.tracks[this.currentTrackIndex];
        t.type = 'granular';
        this.updateControlsVisibility();
        
        const newBuf = ae.generateBufferByType(type);
        if (newBuf) {
            t.buffer = newBuf;
            t.customSample = null;
            t.rmsMap = ae.analyzeBuffer(newBuf);
            
            // Visual feedback
            globalBus.emit(EVENTS.VISUALIZER_UPDATE);
            
            if(btnElement) {
                const originalBg = btnElement.style.backgroundColor;
                btnElement.style.backgroundColor = '#059669'; 
                setTimeout(() => { btnElement.style.backgroundColor = originalBg; }, 200);
            }
            
            // Update header immediately
            this.updateHeader(t, Math.floor(t.id/TRACKS_PER_GROUP), `hsl(${Math.floor(t.id/TRACKS_PER_GROUP)*45}, 70%, 50%)`);
        }
    }

    async handleSampleUpload(file, btnElement) {
        if (!file) return;
        const currentTrack = this.tracks[this.currentTrackIndex];
        const originalText = btnElement ? btnElement.innerHTML : 'Smpl';
        
        try {
            currentTrack.type = 'granular';
            this.updateControlsVisibility();
            
            if(btnElement) {
                btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
                btnElement.disabled = true;
            }

            await this.trackManager.audioEngine.loadCustomSample(file, currentTrack);
            
            // Update header
            const grp = Math.floor(currentTrack.id / TRACKS_PER_GROUP);
            this.updateHeader(currentTrack, grp, `hsl(${grp*45}, 70%, 50%)`);
            
            globalBus.emit(EVENTS.SAMPLE_LOADED, currentTrack.id);
            globalBus.emit(EVENTS.VISUALIZER_UPDATE);

            if(btnElement) {
                btnElement.innerHTML = '<i class="fas fa-check"></i>'; 
                btnElement.classList.add('bg-sky-600');
                setTimeout(() => { 
                    btnElement.innerHTML = originalText; 
                    btnElement.classList.remove('bg-sky-600'); 
                    btnElement.disabled = false; 
                }, 1500);
            }
        } catch (err) { 
            alert('Failed: ' + err.message); 
            if(btnElement) {
                btnElement.innerHTML = originalText; 
                btnElement.disabled = false; 
            }
        }
    }

    resetParameters() {
        const t = this.tracks[this.currentTrackIndex];
        if (t.type === 'granular') {
            t.params.position = 0.00; t.params.spray = 0.00; t.params.grainSize = 0.11;
            t.params.density = 3.00; t.params.pitch = 1.00; t.params.relGrain = 0.50;
        } else { t.params.drumTune = 0.5; t.params.drumDecay = 0.5; }
        
        t.params.hpFilter = 20.00; t.params.filter = 20000.00; t.params.volume = 0.80;
        t.lfos.forEach(lfo => { lfo.target = 'none'; });
        
        this.updateKnobs();
        this.updateLfoUI();
        globalBus.emit(EVENTS.VISUALIZER_UPDATE);
        
        const btn = document.getElementById('resetParamBtn');
        if(btn) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('text-emerald-400', 'border-emerald-500');
            setTimeout(() => { 
                btn.innerHTML = originalContent; 
                btn.classList.remove('text-emerald-400', 'border-emerald-500'); 
            }, 800);
        }
    }

    randomizeCurrentTrackParams() {
        const t = this.tracks[this.currentTrackIndex];
        if (t.type === 'granular') this.trackManager.randomizeTrackParams(t);
        else { t.params.drumTune = Math.random(); t.params.drumDecay = Math.random(); }
        this.updateKnobs();
        globalBus.emit(EVENTS.VISUALIZER_UPDATE);
    }
}