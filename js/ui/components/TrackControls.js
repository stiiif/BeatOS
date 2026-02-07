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
        console.log(`[TrackControls] Tracks set. Count: ${tracks.length}`);
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

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        let container = document.querySelector('.right-pane .p-3.bg-neutral-800');
        if (!container) return;

        container.innerHTML = '';
        container.className = 'p-3 bg-neutral-800 border-b border-neutral-700 flex flex-col gap-2';

        const t = this.tracks[idx];
        const displayNum = idx + 1 < 10 ? `0${idx + 1}` : idx + 1;
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

        const row1 = document.createElement('div');
        row1.className = 'flex items-center gap-2 w-full';
        
        const indicator = document.createElement('span');
        indicator.id = 'trackIndicator';
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

        // NEW: CLEAN MODE TOGGLE BUTTON
        const cleanBtn = document.createElement('button');
        cleanBtn.id = 'cleanModeBtn';
        cleanBtn.innerText = 'CLEAN';
        cleanBtn.title = "Hard AGC: Prevent all distortion";
        cleanBtn.className = `text-[9px] font-bold px-2 py-0.5 rounded transition border shrink-0 ${t.cleanMode ? 'bg-sky-600 text-white border-sky-400' : 'bg-neutral-700 text-neutral-500 border-neutral-600 hover:bg-neutral-600'}`;
        cleanBtn.onclick = () => {
            t.cleanMode = !t.cleanMode;
            this.updateCustomTrackHeader(idx, groupIdx, groupColor);
        };
        row1.appendChild(cleanBtn);

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
                let query = t.type === 'simple-drum' ? (t.params.drumType || "drum") : (t.customSample ? t.customSample.name.replace('.wav', '').replace('.mp3', '') : "drum hit");
                this.searchModal.open(t, query);
            }
        };
        row1.appendChild(searchBtn);

        container.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const rstBtn = document.createElement('button');
        rstBtn.id = 'resetParamBtn';
        rstBtn.className = 'text-[9px] bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 min-w-[24px]';
        rstBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rstBtn.onclick = () => {
             const t = this.tracks[this.selectedTrackIndex];
             if (t.type === 'granular') {
                 t.params.position = 0.00; t.params.spray = 0.00; t.params.grainSize = 0.11;
                 t.params.density = 3.00; t.params.pitch = 1.00; t.params.relGrain = 0.50;
                 t.params.sampleStart = 0.000; t.params.sampleEnd = 1.000;
                 t.params.edgeCrunch = 0.0; t.params.orbit = 0.0; // Reset new params
             } else { t.params.drumTune = 0.5; t.params.drumDecay = 0.5; }
             t.params.hpFilter = 20.00; t.params.filter = 20000.00; t.params.volume = 0.80;
             t.lfos.forEach(lfo => { lfo.target = 'none'; });
             this.updateKnobs();
             this.updateLfoUI();
        };
        row2.appendChild(rstBtn);

        const createTypeBtn = (label, type, colorClass = 'bg-neutral-700', is909 = false, isAuto = false) => {
            const btn = document.createElement('button');
            btn.innerText = label;
            btn.className = `text-[9px] font-bold ${colorClass} hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 flex-1 text-center`;
            btn.onclick = () => {
                if (!this.trackManager || !this.trackManager.audioEngine) return;
                const ae = this.trackManager.audioEngine;
                const t = this.tracks[this.selectedTrackIndex];
                if (isAuto) {
                    t.type = 'automation';
                    t.steps.fill(0);
                    const stepElements = this.matrixStepElements[t.id];
                    if(stepElements) stepElements.forEach(el => { el.className = 'step-btn'; });
                    this.updateTrackControlsVisibility();
                } else if (is909) {
                    t.type = 'simple-drum';
                    t.params.drumType = 'kick'; t.params.drumTune = 0.5; t.params.drumDecay = 0.5;
                    this.updateTrackControlsVisibility();
                    this.updateKnobs();
                } else if (label === 'SMP') {
                    const sampleInput = document.getElementById('sampleInput');
                    if(sampleInput) sampleInput.click();
                } else {
                    t.type = 'granular';
                    this.updateTrackControlsVisibility();
                    const newBuf = ae.generateBufferByType(type);
                    if (newBuf) { t.buffer = newBuf; t.customSample = null; t.rmsMap = ae.analyzeBuffer(newBuf); }
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
            btn.onclick = () => { t.chokeGroup = (t.chokeGroup === targetGroup) ? 0 : targetGroup; this.selectTrack(this.selectedTrackIndex); };
            row3.appendChild(btn);
        }
        container.appendChild(row3);
    }

    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        const btnBar = document.getElementById('resetOnBarBtn');
        const btnTrig = document.getElementById('resetOnTrigBtn');

        if (btnBar) {
            btnBar.onclick = () => { t.resetOnBar = !t.resetOnBar; this.updateTrackControlsVisibility(); };
            btnBar.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnBar ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

        if (btnTrig) {
            btnTrig.onclick = () => { t.resetOnTrig = !t.resetOnTrig; this.updateTrackControlsVisibility(); };
            btnTrig.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnTrig ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

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
            const wasHidden = granularControls && granularControls.classList.contains('hidden');
            if(granularControls) granularControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            if(wasHidden) setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        }
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
                
                // Special formatting for new params
                if(param === 'edgeCrunch') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'orbit') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }

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
        const grp = this.randomChokeMode ? this.randomChokeGroups[this.selectedTrackIndex] : normalGrp;
        const groupColorDark = `hsl(${grp * 45}, 70%, 35%)`;
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if(i === this.selectedLfoIndex) { b.classList.remove('text-neutral-400', 'hover:bg-neutral-700'); b.classList.add('text-white'); b.style.backgroundColor = groupColorDark; }
            else { b.classList.add('text-neutral-400', 'hover:bg-neutral-700'); b.classList.remove('text-white'); b.style.backgroundColor = ''; }
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

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
}