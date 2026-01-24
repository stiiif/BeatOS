// UI Manager Module - Refactored for Phase 2
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { PatternLibrary } from '../modules/PatternLibrary.js';
import { SearchModal } from './SearchModal.js';
import { SequencerGrid } from './components/SequencerGrid.js'; // New Component
import { globalBus } from '../events/EventBus.js';
import { EVENTS } from '../events/Events.js';

export class UIManager {
    constructor() {
        this.tracks = [];
        this.trackManager = null; 
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        
        // Components
        this.sequencerGrid = null;
        this.searchModal = null;
        
        this.patternLibrary = new PatternLibrary();
        
        // Define Keyboard Mapping
        this.keyMapping = {
            'Digit1': 0, 'KeyQ': 1, 'KeyA': 2, 'KeyZ': 3,
            'Digit2': 4, 'KeyW': 5, 'KeyS': 6, 'KeyX': 7,
            'Digit3': 8, 'KeyE': 9, 'KeyD': 10, 'KeyC': 11,
            'Digit4': 12, 'KeyR': 13, 'KeyF': 14, 'KeyV': 15,
            'Digit5': 16, 'KeyT': 17, 'KeyG': 18, 'KeyB': 19,
            'Digit6': 20, 'KeyY': 21, 'KeyH': 22, 'KeyN': 23,
            'Digit7': 24, 'KeyU': 25, 'KeyJ': 26, 'KeyM': 27,
            'Digit8': 28, 'KeyI': 29, 'KeyK': 30, 'Comma': 31
        };
        
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    initUI(addTrackCallback, addGroupCallback) {
        // Ensure CSS var is set again
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
        this.generateLfoTabs();

        // --- INIT SUB-COMPONENTS ---
        // Pass 'matrixContainer' ID and trackManager
        this.sequencerGrid = new SequencerGrid('matrixContainer', this.trackManager);

        // Setup Buttons
        const buttonRow = document.createElement('div');
        buttonRow.id = 'matrixButtonRow';
        buttonRow.className = 'flex gap-2 mt-2 px-1';
        
        const addTrackBtn = document.createElement('button');
        addTrackBtn.id = 'addTrackBtn';
        addTrackBtn.className = 'flex-1';
        addTrackBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>ADD NEW TRACK';
        addTrackBtn.onclick = () => addTrackCallback();
        
        const addGroupBtn = document.createElement('button');
        addGroupBtn.id = 'addGroupBtn';
        addGroupBtn.className = 'flex-1';
        addGroupBtn.innerHTML = '<i class="fas fa-layer-group mr-2"></i>ADD NEW GROUP';
        addGroupBtn.onclick = () => addGroupCallback();
        
        buttonRow.appendChild(addTrackBtn);
        buttonRow.appendChild(addGroupBtn);
        
        const container = document.getElementById('matrixContainer');
        container.appendChild(buttonRow);

        this.bindAutomationControls();
        
        // --- Initialize Groove Controls ---
        this.initGrooveControls();

        // Initialize Search Modal
        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
        }
        
        // Event Listeners
        globalBus.on(EVENTS.TRACK_SELECTED, (index) => {
            this.selectedTrackIndex = index;
            this.selectTrack(index);
        });

        globalBus.on(EVENTS.PLAYBACK_STOP, () => {
            if(this.sequencerGrid) this.sequencerGrid.clearPlayheadForStop();
        });

        document.body.addEventListener('wheel', (e) => {
            if (e.target.type === 'range') {
                e.preventDefault();
                this.handleSliderWheel(e);
            }
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (this.keyMapping.hasOwnProperty(e.code)) {
                const stepIndex = this.keyMapping[e.code];
                const currentTrackId = this.selectedTrackIndex;
                if (currentTrackId >= 0 && currentTrackId < this.tracks.length) {
                    if(stepIndex < NUM_STEPS) {
                        // Delegate to Grid Component
                        this.sequencerGrid.handleStepClick(currentTrackId, stepIndex);
                    }
                }
            }
        });
    }

    generateLfoTabs() {
        const container = document.getElementById('lfoTabsContainer');
        if (!container) return;
        container.innerHTML = '';
        for(let i=0; i<NUM_LFOS; i++) {
            const btn = document.createElement('button');
            btn.className = 'lfo-tab flex-1 text-[10px] font-bold py-1 rounded transition text-neutral-400 hover:bg-neutral-700 min-w-[40px]';
            btn.dataset.lfo = i;
            btn.innerText = `LFO ${i+1}`;
            btn.addEventListener('click', (e) => {
                this.setSelectedLfoIndex(parseInt(e.target.dataset.lfo));
                this.updateLfoUI();
            });
            container.appendChild(btn);
        }
    }

    initGrooveControls() {
        const patternSelect = document.getElementById('patternSelect');
        const targetGroupSelect = document.getElementById('targetGroupSelect');
        const patternInfluence = document.getElementById('patternInfluence');
        const patternInfluenceVal = document.getElementById('patternInfluenceVal');

        if(patternSelect) {
            patternSelect.innerHTML = '<option value="">Select Pattern...</option>';
            const patterns = this.patternLibrary.getPatterns();
            patterns.sort((a,b) => a.name.localeCompare(b.name));
            patterns.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.innerText = `${p.name} (${p.genre || 'World'})`;
                patternSelect.appendChild(opt);
            });
        }

        if(targetGroupSelect) {
            targetGroupSelect.innerHTML = '';
            const maxGroups = Math.ceil(MAX_TRACKS / TRACKS_PER_GROUP);
            for(let i=0; i<maxGroups; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.innerText = `Group ${i+1} (Trk ${i*TRACKS_PER_GROUP+1}-${(i+1)*TRACKS_PER_GROUP})`;
                targetGroupSelect.appendChild(opt);
            }
        }

        if(patternInfluence) {
            patternInfluence.addEventListener('input', (e) => {
                if(patternInfluenceVal) patternInfluenceVal.innerText = e.target.value;
            });
        }
        
        const applyBtn = document.getElementById('applyGrooveBtn');
        if(applyBtn) {
            applyBtn.onclick = () => this.applyGroove();
        }
    }

    applyGroove() {
        // Logic for applying grooves... kept here for now, 
        // will move to GroovePanel.js in later steps.
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
        // Update Grid Visuals (Dividers) via Grid Component
        // Note: The Grid component currently handles this via re-render or class updates.
        // For now, we will just apply the data logic here.
        
        for (let i = 0; i < TRACKS_PER_GROUP; i++) {
            const targetTrackId = startTrack + i;
            const patternTrack = pattern.tracks[i];
            
            if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && this.tracks[targetTrackId].type !== 'automation') {
                const targetTrackObj = this.tracks[targetTrackId];
                targetTrackObj.steps.fill(0);
                targetTrackObj.microtiming.fill(0);

                if (patternTrack) {
                    if (this.trackManager) {
                        this.trackManager.autoConfigureTrack(targetTrackObj, patternTrack.instrument_type || patternTrack.instrument);
                    }
                    const stepString = patternTrack.steps;
                    const microtimingArray = patternTrack.microtiming;

                    for (let s = 0; s < NUM_STEPS; s++) {
                        const charIndex = s % stepString.length;
                        const char = stepString[charIndex];
                        const velocity = parseInt(char);
                        const roll = Math.random();
                        
                        if (roll < influence) {
                            if (!isNaN(velocity) && velocity > 0) {
                                targetTrackObj.steps[s] = velocity;
                                if (microtimingArray && microtimingArray[charIndex] !== undefined) {
                                    targetTrackObj.microtiming[s] = microtimingArray[charIndex];
                                }
                            }
                        } else {
                            if (Math.random() < 0.05) targetTrackObj.steps[s] = 1; 
                        }
                    }
                }
            }
        }
        
        // Tell grid to refresh
        if(this.sequencerGrid) this.sequencerGrid.refreshGridState();
        
        // Select first track of group
        globalBus.emit(EVENTS.TRACK_SELECTED, startTrack);
    }

    bindAutomationControls() {
        const sel = document.getElementById('autoSpeedSelect');
        if(sel) {
            sel.addEventListener('change', (e) => {
                const t = this.tracks[this.selectedTrackIndex];
                if(t && t.type === 'automation') {
                    t.clockDivider = parseInt(e.target.value);
                }
            });
        }
    }

    handleSliderWheel(e) {
        const el = e.target;
        const step = parseFloat(el.step) || 0.01;
        const min = parseFloat(el.min);
        const max = parseFloat(el.max);
        const isCoarse = (e.buttons & 4) === 4; 
        const dir = Math.sign(e.deltaY) * -1; 
        const multiplier = isCoarse ? 10 : 1;
        let val = parseFloat(el.value);
        val += dir * step * multiplier;
        val = Math.max(min, Math.min(max, val));
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // --- DELEGATION: Methods called by main.js that should now route to Grid ---
    appendTrackRow(trk, visualizerCallback = null) {
        // visualizerCallback is largely obsolete with EventBus but kept for safety
        if (this.sequencerGrid) this.sequencerGrid.appendTrackRow(trk);
        // Note: We also need to emit TRACK_ADDED if it came from outside, 
        // but here we assume main.js calls this. Ideally main.js emits the event 
        // and SequencerGrid listens. For phase 2 transition, direct call is fine.
        
        // We emit event to notify other components (like visualizer)
        globalBus.emit(EVENTS.TRACK_ADDED, trk);
    }

    // --- REMAINING INSPECTOR LOGIC (To be moved in Phase 2.2) ---
    selectTrack(idx) {
        this.selectedTrackIndex = idx;
        const t = this.tracks[idx];
        if(!t) return;

        const displayNum = idx + 1;
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;
        
        const grp = Math.floor(idx / TRACKS_PER_GROUP); // Simplified group logic
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

        // ROW 1
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

        // ROW 2
        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const rstBtn = document.createElement('button');
        rstBtn.id = 'resetParamBtn';
        rstBtn.className = 'text-[9px] bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 min-w-[24px]';
        rstBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rstBtn.onclick = () => {
             if (t.type === 'granular') {
                 t.params.position = 0.00; t.params.spray = 0.00; t.params.grainSize = 0.11;
                 t.params.density = 3.00; t.params.pitch = 1.00; t.params.relGrain = 0.50;
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
                
                if (isAuto) {
                    t.type = 'automation';
                    t.steps.fill(0);
                    // Refresh grid via component
                    if(this.sequencerGrid) this.sequencerGrid.refreshTrackRow(t.id);
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
                    if (newBuf) {
                        t.buffer = newBuf;
                        t.customSample = null;
                        t.rmsMap = ae.analyzeBuffer(newBuf);
                    }
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

        // ROW 3: Group Selectors
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
                this.selectTrack(this.selectedTrackIndex); 
            };
            row3.appendChild(btn);
        }
        container.appendChild(row3);
    }

    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
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
            setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        }
    }

    // Proxy for scheduler usage, though Scheduler should ideally emit events
    updateMatrixHead(currentStep, totalStepsPlayed) {
        if(this.sequencerGrid) this.sequencerGrid.updatePlayhead(currentStep, totalStepsPlayed);
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
    
    // Legacy placeholders - now handled in Grid component mostly, 
    // but some external buttons in Main.js might call these via UIManager proxy.
    // Ideally Main.js should access Grid component directly or emit event.
    
    toggleStepLock(trk) { this.sequencerGrid.toggleTrackState(trk, 'stepLock'); }
    clearTrack(trk) { this.sequencerGrid.clearTrack(trk); }
    clearGroup(grp) { this.sequencerGrid.clearGroup(grp); }
    randomizeTrackPattern(trkIdx) { this.sequencerGrid.randomizeTrack(trkIdx); }
    randomizeAllPatterns() { 
        this.tracks.forEach((_, i) => this.sequencerGrid.randomizeTrack(i)); 
        globalBus.emit(EVENTS.PATTERN_RANDOMIZED);
    }
    
    // Inspector related - to be moved next phase
    updateKnobs() {
        const t = this.tracks[this.selectedTrackIndex];
        if(!t) return;
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                let suffix = '';
                if(param === 'density') suffix = 'hz';
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                if(el.nextElementSibling) el.nextElementSibling.innerText = t.params[param].toFixed(2) + suffix;
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

    toggleSnapshot() {
        // ... (Snapshot logic remains for now, will move to StateManager or TransportBar later) ...
        const btn = document.getElementById('snapshotBtn');
        if(!this.snapshotData) {
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: {...t.params},
                    steps: Array.from(t.steps),
                    muted: t.muted, soloed: t.soloed, stepLock: t.stepLock, ignoreRandom: t.ignoreRandom,
                    lfos: t.lfos.map(l => ({ wave: l.wave, rate: l.rate, amount: l.amount, target: l.target }))
                }))
            });
            btn.classList.add('snap-active');
            btn.innerText = 'RESTORE';
        } else {
            try {
                const data = JSON.parse(this.snapshotData);
                data.tracks.forEach((trackData, i) => {
                    if (i >= this.tracks.length) return;
                    const t = this.tracks[i];
                    t.params = { ...trackData.params };
                    t.steps = new Uint8Array(trackData.steps);
                    t.muted = trackData.muted; t.soloed = trackData.soloed;
                    t.stepLock = trackData.stepLock; t.ignoreRandom = trackData.ignoreRandom; 
                    trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave; t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount; t.lfos[lIdx].target = lData.target;
                        }
                    });
                    
                    // Sync Visuals
                    if(this.sequencerGrid) {
                        this.sequencerGrid.updateTrackStateVisuals(i);
                        this.sequencerGrid.refreshTrackRow(i);
                    }
                    
                    if(t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                    if(t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                    if(t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if(t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                });
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                this.selectTrack(this.selectedTrackIndex);
            } catch(e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }
    
    // Random Choke logic handled by Scheduler callback, UIManager just stores state
    toggleRandomChoke() {
        this.randomChokeMode = !this.randomChokeMode;
        if(this.randomChokeMode) this.randomChokeGroups = this.tracks.map(() => Math.floor(Math.random() * 8));
        else this.randomChokeGroups = [];
        const btn = document.getElementById('rndChokeBtn');
        if(btn) this.randomChokeMode ? btn.classList.add('rnd-choke-active') : btn.classList.remove('rnd-choke-active');
    }
    
    getRandomChokeInfo() { return { mode: this.randomChokeMode, groups: this.randomChokeGroups }; }
    
    // Pan Shift
    savePanBaseline() { this.basePanValues = this.tracks.map(t => t.params.pan); }
    applyPanShift(shiftAmount) { /* ... same logic ... */ 
        this.globalPanShift = shiftAmount; if (this.basePanValues.length === 0) this.savePanBaseline(); const numGroups = 8; for (let i = 0; i < this.tracks.length; i++) { const groupIdx = Math.floor(i / TRACKS_PER_GROUP); const basePan = this.basePanValues[i] || 0; const shiftInGroups = shiftAmount * numGroups; const newGroupPosition = (groupIdx + shiftInGroups) % numGroups; const newGroupCenter = -1 + (newGroupPosition / (numGroups - 1)) * 2; const originalGroupCenter = -1 + (groupIdx / (numGroups - 1)) * 2; const offsetFromCenter = basePan - originalGroupCenter; let newPan = newGroupCenter + offsetFromCenter; newPan = Math.max(-1, Math.min(1, newPan)); this.tracks[i].params.pan = parseFloat(newPan.toFixed(3)); if(this.tracks[i].bus && this.tracks[i].bus.pan) { this.tracks[i].bus.pan.pan.value = newPan; } }
    }
    
    clearPlayheadForStop() {
        if(this.sequencerGrid) this.sequencerGrid.clearPlayheadForStop();
    }
}