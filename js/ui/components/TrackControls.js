// js/ui/components/TrackControls.js
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';

export class TrackControls {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        this.trackLabelElements = [];
        this.matrixStepElements = [];
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.trackManager = null;
        this.searchModal = null;
        this.visualizerCallback = null;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setGridElements(trackLabelElements, matrixStepElements) {
        this.trackLabelElements = trackLabelElements;
        this.matrixStepElements = matrixStepElements;
    }

    setRandomChokeInfo(mode, groups) {
        this.randomChokeMode = mode;
        this.randomChokeGroups = groups;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setSearchModal(modal) {
        this.searchModal = modal;
    }

    // ============================================================================
    // TRACK SELECTION
    // ============================================================================

    selectTrack(idx, visualizerCallback = null) {
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.remove('selected');
        this.selectedTrackIndex = idx;
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.add('selected');
        
        const displayNum = idx + 1;
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;
        
        const normalGrp = Math.floor(idx / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[idx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${grp * 45}, 70%, 50%, 0.4)`;
        
        const grpLbl = document.getElementById('trackGroupLabel');
        if(grpLbl) {
            grpLbl.innerText = `GRP ${grp}`;
            grpLbl.style.color = groupColor;
        }
        
        this.updateCustomTrackHeader(idx, grp, groupColor);

        const indicator = document.getElementById('trackIndicator');
        if(indicator) {
            indicator.style.backgroundColor = groupColor;
            indicator.style.boxShadow = `0 0 8px ${groupColorGlow}`;
        }
        
        const rightPanel = document.querySelector('.right-pane');
        if (rightPanel) {
            rightPanel.style.setProperty('--group-color', groupColor);
            rightPanel.style.setProperty('--group-color-glow', groupColorGlow);
        }
        
        this.updateKnobs();
        this.updateLfoUI();
        this.updateTrackControlsVisibility(); 
        if (visualizerCallback) visualizerCallback();
    }

    // ============================================================================
    // CUSTOM TRACK HEADER (RESTORATION OF ALL BUTTONS)
    // ============================================================================

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        let container = document.querySelector('.right-pane .p-3.bg-neutral-800');
        if (!container) return;

        container.innerHTML = '';
        container.className = 'p-3 bg-neutral-800 border-b border-neutral-700 flex flex-col gap-2';

        const t = this.tracks[idx];
        const displayNum = idx + 1 < 10 ? `0${idx + 1}` : idx + 1;
        let trackName = `Track ${displayNum}`;
        let trackType = t.type.toUpperCase();
        
        if (t.customSample) {
            trackName = t.customSample.name;
            trackType = 'SAMPLE';
        } else if (t.type === 'simple-drum') {
            trackName = (t.params.drumType || 'Kick').toUpperCase();
            trackType = '909';
        }

        // ROW 1: STATUS, NAME, CLEAN TOGGLE, FIND
        const row1 = document.createElement('div');
        row1.className = 'flex items-center gap-2 w-full';
        
        const indicator = document.createElement('span');
        indicator.id = 'trackIndicator';
        indicator.className = 'w-3 h-3 rounded-full transition-colors duration-200 shrink-0';
        indicator.style.backgroundColor = groupColor;
        row1.appendChild(indicator);

        const numSpan = document.createElement('span');
        numSpan.innerText = displayNum;
        numSpan.className = 'text-sm font-bold text-white font-mono';
        row1.appendChild(numSpan);

        const nameSpan = document.createElement('span');
        nameSpan.innerText = trackName;
        nameSpan.className = 'text-xs text-neutral-300 truncate flex-1';
        nameSpan.title = trackName;
        row1.appendChild(nameSpan);

        // CLEAN MODE BUTTON
        const cleanBtn = document.createElement('button');
        cleanBtn.id = 'cleanModeBtn';
        cleanBtn.innerText = 'CLEAN';
        cleanBtn.className = `text-[9px] font-bold px-2 py-0.5 rounded transition border shrink-0 ${t.cleanMode ? 'bg-sky-600 text-white border-sky-400' : 'bg-neutral-700 text-neutral-500 border-neutral-600 hover:bg-neutral-600'}`;
        cleanBtn.onclick = () => {
            t.cleanMode = !t.cleanMode;
            this.sendToWorklet(t.id, 'cleanMode', t.cleanMode);
            this.updateCustomTrackHeader(idx, groupIdx, groupColor);
        };
        row1.appendChild(cleanBtn);

        const typeLabel = document.createElement('span');
        typeLabel.innerText = `[${trackType}]`;
        typeLabel.className = 'text-[10px] text-neutral-500 font-mono uppercase ml-1';
        row1.appendChild(typeLabel);

        // RESTORED FIND BUTTON
        const searchBtn = document.createElement('button');
        searchBtn.className = 'text-[10px] bg-emerald-900/30 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-900/50 ml-2';
        searchBtn.innerHTML = '<i class="fas fa-search mr-1"></i>Find';
        searchBtn.onclick = () => {
            if (this.searchModal) {
                let query = t.type === 'simple-drum' ? t.params.drumType : (t.customSample ? t.customSample.name.replace('.wav', '') : "drum hit");
                this.searchModal.open(t, query);
            }
        };
        row1.appendChild(searchBtn);

        container.appendChild(row1);

        // ROW 2: ENGINE TYPE BUTTONS & RESET
        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const rstBtn = document.createElement('button');
        rstBtn.className = 'text-[9px] bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 min-w-[24px]';
        rstBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rstBtn.onclick = () => {
             const track = this.tracks[this.selectedTrackIndex];
             if (track.type === 'granular') {
                 track.params.position = 0.00; track.params.spray = 0.00; track.params.grainSize = 0.11;
                 track.params.density = 3.00; track.params.pitch = 1.00; track.params.relGrain = 0.50;
             } else { track.params.drumTune = 0.5; track.params.drumDecay = 0.5; }
             this.updateKnobs();
        };
        row2.appendChild(rstBtn);

        const createTypeBtn = (label, type, colorClass = 'bg-neutral-700', is909 = false, isAuto = false) => {
            const btn = document.createElement('button');
            btn.innerText = label;
            btn.className = `text-[9px] font-bold ${colorClass} hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 flex-1 text-center`;
            btn.onclick = () => {
                if (!this.trackManager || !this.trackManager.audioEngine) return;
                const ae = this.trackManager.audioEngine;
                const track = this.tracks[this.selectedTrackIndex];
                if (isAuto) {
                    track.type = 'automation';
                    track.steps.fill(0);
                    const stepEls = this.matrixStepElements[track.id];
                    if(stepEls) stepEls.forEach(el => el.className = 'step-btn');
                } else if (is909) {
                    track.type = 'simple-drum';
                    track.params.drumType = 'kick';
                } else if (label === 'SMP') {
                    document.getElementById('sampleInput').click();
                } else {
                    track.type = 'granular';
                    const newBuf = ae.generateBufferByType(type);
                    if (newBuf) { track.buffer = newBuf; track.customSample = null; }
                }
                this.selectTrack(this.selectedTrackIndex); 
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

        // ROW 3: HEAT ENGINE PANEL
        const heatPanel = document.createElement('div');
        heatPanel.className = 'bg-neutral-950/50 p-2 rounded border border-neutral-700 space-y-2 mt-1';
        
        const createHeatControl = (label, prop, min, max, step) => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2';
            div.innerHTML = `<label class="text-[8px] text-neutral-500 font-bold uppercase w-10">${label}</label>`;
            const input = document.createElement('input');
            input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = t[prop];
            input.className = 'flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer';
            const valSpan = document.createElement('span');
            valSpan.className = 'text-[9px] text-orange-400 font-mono w-8 text-right';
            valSpan.innerText = t[prop].toFixed(2);
            input.oninput = (e) => {
                const val = parseFloat(e.target.value);
                t[prop] = val; valSpan.innerText = val.toFixed(2);
                this.sendToWorklet(t.id, prop, val);
            };
            div.appendChild(input); div.appendChild(valSpan);
            return div;
        };

        heatPanel.appendChild(createHeatControl('Heat', 'heatDrive', 0.1, 10.0, 0.1));
        heatPanel.appendChild(createHeatControl('Limit', 'heatCeiling', 0.1, 1.0, 0.05));
        container.appendChild(heatPanel);

        // ROW 4: CHOKE GROUPS
        const row4 = document.createElement('div');
        row4.className = 'flex gap-0.5 w-full mt-1';
        const grpLabel = document.createElement('span');
        grpLabel.innerText = 'CHK';
        grpLabel.className = 'text-[9px] font-bold text-neutral-500 mr-1 flex items-center';
        row4.appendChild(grpLabel);

        for(let i=0; i<8; i++) {
            const btn = document.createElement('button');
            const targetGroup = i + 1;
            const isAssigned = t.chokeGroup === targetGroup;
            const bgClass = isAssigned ? '' : 'bg-neutral-800 text-neutral-500';
            const style = isAssigned ? `background-color: #ef4444; color: #fff; border-color: #b91c1c;` : '';
            btn.className = `flex-1 h-4 text-[8px] border border-neutral-700 rounded flex items-center justify-center hover:bg-neutral-700 transition ${bgClass}`;
            btn.style.cssText = style;
            btn.innerText = targetGroup;
            btn.onclick = () => { t.chokeGroup = (t.chokeGroup === targetGroup) ? 0 : targetGroup; this.selectTrack(this.selectedTrackIndex); };
            row4.appendChild(btn);
        }
        container.appendChild(row4);
    }

    sendToWorklet(id, param, value) {
        if (this.trackManager?.audioEngine?.granularSynth) {
            this.trackManager.audioEngine.granularSynth.updateTrackParam(id, param, value);
        }
    }

    // ============================================================================
    // VISIBILITY & UPDATES
    // ============================================================================

    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;
        const btnBar = document.getElementById('resetOnBarBtn');
        const btnTrig = document.getElementById('resetOnTrigBtn');
        if (btnBar) btnBar.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnBar ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`;
        if (btnTrig) btnTrig.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnTrig ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`;

        document.getElementById('granularControls').classList.toggle('hidden', t.type !== 'granular');
        document.getElementById('simpleDrumControls').classList.toggle('hidden', t.type !== 'simple-drum');
        document.getElementById('automationControls').classList.toggle('hidden', t.type !== 'automation');
        document.getElementById('lfoSection').classList.toggle('hidden', t.type === 'automation');
    }

    updateKnobs() {
        const t = this.tracks[this.selectedTrackIndex];
        if(!t) return;
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                let suffix = '';
                let displayValue = t.params[param].toFixed(3); 
                if(param === 'density') { suffix = 'hz'; displayValue = t.params[param].toFixed(0); }
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                let displayEl = el.nextElementSibling;
                if (displayEl && !displayEl.classList.contains('value-display')) displayEl = el.parentElement.nextElementSibling;
                if(displayEl && displayEl.classList.contains('value-display')) displayEl.innerText = displayValue + suffix;
            }
        });
    }

    updateLfoUI() {
        if(!this.tracks[this.selectedTrackIndex]) return;
        const lfo = this.tracks[this.selectedTrackIndex].lfos[this.selectedLfoIndex];
        const normalGrp = Math.floor(this.selectedTrackIndex / TRACKS_PER_GROUP);
        const groupColorDark = `hsl(${normalGrp * 45}, 70%, 35%)`;
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if(i === this.selectedLfoIndex) { b.classList.remove('text-neutral-400'); b.classList.add('text-white'); b.style.backgroundColor = groupColorDark; }
            else { b.classList.add('text-neutral-400'); b.classList.remove('text-white'); b.style.backgroundColor = ''; }
        });
        if(document.getElementById('lfoRate')) document.getElementById('lfoRate').value = lfo.rate;
        if(document.getElementById('lfoAmt')) document.getElementById('lfoAmt').value = lfo.amount;
        if(document.getElementById('lfoRateVal')) document.getElementById('lfoRateVal').innerText = lfo.rate.toFixed(1);
        if(document.getElementById('lfoAmtVal')) document.getElementById('lfoAmtVal').innerText = lfo.amount.toFixed(2);
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
}