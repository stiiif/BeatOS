// UI Manager Module - Updated for Real-Time Bus Control & Automation Tracks
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS } from '../utils/constants.js';

export class UIManager {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
        this.snapshotData = null;
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.basePanValues = [];
        this.globalPanShift = 0;
        
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
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    initUI(addTrackCallback, addGroupCallback, visualizerCallback = null) {
        this.visualizerCallback = visualizerCallback;
        
        // --- Step Headers ---
        const headerContainer = document.getElementById('stepHeaders');
        headerContainer.className = 'sequencer-grid sticky top-0 bg-neutral-950 z-30 pb-2 border-b border-neutral-800 pt-2';
        headerContainer.innerHTML = '';
        
        const trkHeader = document.createElement('div');
        trkHeader.className = 'header-cell font-bold';
        trkHeader.innerText = 'TRK';
        headerContainer.appendChild(trkHeader);

        for(let i=0; i<NUM_STEPS; i++) {
            const div = document.createElement('div');
            div.className = 'header-cell';
            div.innerText = i+1;
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) div.classList.add('beat-divider');
            headerContainer.appendChild(div);
        }

        const rndHeader = document.createElement('div');
        rndHeader.className = 'header-cell';
        rndHeader.innerHTML = '<i class="fas fa-dice"></i>';
        headerContainer.appendChild(rndHeader);

        const actHeader = document.createElement('div');
        actHeader.className = 'header-cell';
        actHeader.innerText = 'ACTIONS';
        headerContainer.appendChild(actHeader);

        // --- Matrix ---
        const container = document.getElementById('matrixContainer');
        container.innerHTML = ''; 
        
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
        
        container.appendChild(buttonRow);

        this.tracks.forEach(t => {
            this.appendTrackRow(t.id, visualizerCallback);
        });

        // Initialize Automation Control Listeners
        this.bindAutomationControls();

        // Visualizer Click Selection
        const vis = document.getElementById('visualizer');
        if(vis) {
            vis.addEventListener('click', (e) => {
                if(this.tracks.length === 0) return;
                const rect = vis.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const w = rect.width;
                const trkIdx = Math.floor((x / w) * this.tracks.length);
                if(trkIdx >= 0 && trkIdx < this.tracks.length) this.selectTrack(trkIdx, visualizerCallback);
            });
        }

        // Handle Wheel
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
                    this.toggleStep(currentTrackId, stepIndex);
                }
            }
        });
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

    appendTrackRow(trk, visualizerCallback = null) {
        const container = document.getElementById('matrixContainer');
        const buttonRow = document.getElementById('matrixButtonRow');
        
        const trackObj = this.tracks[trk];
        const groupIdx = Math.floor(trk / TRACKS_PER_GROUP);
        if (this.randomChokeMode && this.randomChokeGroups.length === trk) {
            this.randomChokeGroups.push(Math.floor(Math.random() * 8));
        }
        
        const effectiveGroup = this.randomChokeMode ? this.randomChokeGroups[trk] : groupIdx;
        const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'sequencer-grid'; 
        const rowElements = [];
        
        const label = document.createElement('div');
        label.className = `track-label ${trk===0 ? 'selected' : ''}`;
        const displayNum = trk + 1;
        label.innerText = displayNum < 10 ? `0${displayNum}` : displayNum;
        label.title = `Group ${effectiveGroup}`;
        label.onclick = () => this.selectTrack(trk, visualizerCallback);
        label.style.borderRight = `3px solid ${groupColor}`;
        rowDiv.appendChild(label);
        this.trackLabelElements[trk] = label;
        this.matrixStepElements[trk] = [];
        rowElements.push(label);

        for(let step=0; step<NUM_STEPS; step++) {
            const btn = document.createElement('div');
            btn.className = 'step-btn';
            btn.dataset.step = step;
            btn.dataset.track = trk;
            btn.onclick = () => this.toggleStep(trk, step);
            btn.style.setProperty('--step-group-color', groupColor);
            btn.style.setProperty('--step-group-color-glow', groupColorGlow);
            if ((step + 1) % 4 === 0 && step !== NUM_STEPS - 1) btn.classList.add('beat-divider');
            
            // Check state logic based on track type
            if (trackObj.type === 'automation') {
                const val = trackObj.steps[step];
                if (val > 0) {
                    btn.classList.add('active');
                    btn.classList.add(`auto-level-${val}`);
                }
            } else {
                if (trackObj.steps[step]) btn.classList.add('active');
            }

            rowDiv.appendChild(btn);
            this.matrixStepElements[trk][step] = btn;
            rowElements.push(btn);
        }

        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.onclick = () => this.randomizeTrackPattern(trk);
        rowDiv.appendChild(rndBtn);
        rowElements.push(rndBtn);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'track-actions';
        const createAction = (txt, fn, title, cls='') => {
            const b = document.createElement('button');
            b.className = 'action-btn ' + cls;
            b.innerHTML = txt; b.title = title;
            b.onclick = (e) => { e.stopPropagation(); fn(trk); };
            return b;
        };
        const btnM = createAction('M', (t) => this.toggleMute(t), 'Mute Track'); btnM.id = `btnM_${trk}`;
        const btnS = createAction('S', (t) => this.toggleSolo(t), 'Solo Track'); btnS.id = `btnS_${trk}`;
        const btnL = createAction('L', (t) => this.toggleStepLock(t), 'Lock Steps'); btnL.id = `btnL_${trk}`;
        actionsDiv.appendChild(btnL); actionsDiv.appendChild(btnM);
        actionsDiv.appendChild(createAction('Mg', () => this.toggleMuteGroup(groupIdx), 'Mute Group'));
        actionsDiv.appendChild(btnS);
        actionsDiv.appendChild(createAction('Sg', () => this.toggleSoloGroup(groupIdx), 'Solo Group'));
        actionsDiv.appendChild(createAction('C', () => this.clearTrack(trk), 'Clear Track', 'erase'));
        actionsDiv.appendChild(createAction('Cg', () => this.clearGroup(groupIdx), 'Clear Group', 'erase'));
        
        // NEW EXCLUDE RANDOM BUTTON (X)
        const btnX = createAction('X', (t) => this.toggleIgnoreRandom(t), 'Exclude from Auto Randomization (Rand Prms)');
        btnX.id = `btnX_${trk}`;
        if(trackObj.ignoreRandom) btnX.classList.add('exclude-active');
        actionsDiv.appendChild(btnX);

        rowDiv.appendChild(actionsDiv);
        rowElements.push(actionsDiv);
        
        if (buttonRow) container.insertBefore(rowDiv, buttonRow); else container.appendChild(rowDiv);
        this.trackRowElements[trk] = rowElements;
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
        this.updateTrackControlsVisibility(); // Ensure UI matches track type
        if (visualizerCallback) visualizerCallback();
    }

    // Comprehensive visibility logic to ensure controls reappear
    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const lfoSection = document.getElementById('lfoSection');
        const typeLabel = document.getElementById('trackTypeLabel');
        const speedSel = document.getElementById('autoSpeedSelect');

        // 1. Reset: Hide everything first
        if(granularControls) granularControls.classList.add('hidden');
        if(drumControls) drumControls.classList.add('hidden');
        if(lfoSection) lfoSection.classList.add('hidden');
        if(autoControls) autoControls.classList.add('hidden');

        // 2. Show based on Type
        if (t.type === 'automation') {
            if(autoControls) autoControls.classList.remove('hidden');
            if(typeLabel) {
                typeLabel.textContent = "AUTO SEQ";
                typeLabel.className = "text-[10px] text-indigo-400 font-mono uppercase font-bold";
            }
            if(speedSel) speedSel.value = t.clockDivider || 1;
        } 
        else if (t.type === 'simple-drum') {
            if(drumControls) drumControls.classList.remove('hidden');
            // 909 usually doesn't show LFOs in this app design, but if you want them, uncomment next line
            // if(lfoSection) lfoSection.classList.remove('hidden');

            if(typeLabel) {
                typeLabel.textContent = "909 " + (t.params.drumType || 'KICK').toUpperCase();
                typeLabel.className = "text-[10px] text-orange-400 font-mono uppercase truncate max-w-[80px]";
            }
             // Update Drum Select Buttons State
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
            // Default: Granular
            if(granularControls) granularControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            
            if(typeLabel) {
                if (t.customSample) {
                    typeLabel.textContent = t.customSample.name;
                    typeLabel.className = "text-[10px] text-sky-400 font-mono uppercase truncate max-w-[80px]";
                } else {
                    typeLabel.textContent = "GRANULAR";
                    typeLabel.className = "text-[10px] text-emerald-400 font-mono uppercase truncate max-w-[80px]";
                }
            }
        }
    }

    updateMatrixHead(current) {
        const prev = (current - 1 + NUM_STEPS) % NUM_STEPS;
        for(let t=0; t<this.tracks.length; t++) {
            if(this.matrixStepElements[t] && this.matrixStepElements[t][prev]) this.matrixStepElements[t][prev].classList.remove('step-playing');
            if(this.matrixStepElements[t] && this.matrixStepElements[t][current]) this.matrixStepElements[t][current].classList.add('step-playing');
        }
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
    getRandomChokeInfo() { return { mode: this.randomChokeMode, groups: this.randomChokeGroups }; }
    
    toggleStepLock(trk) { this.tracks[trk].stepLock = !this.tracks[trk].stepLock; const btnL = document.getElementById(`btnL_${trk}`); if (this.tracks[trk].stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active'); }
    toggleRandomChoke() {
        this.randomChokeMode = !this.randomChokeMode;
        const btn = document.getElementById('rndChokeBtn');
        if (this.randomChokeMode) {
            this.randomChokeGroups = this.tracks.map(() => Math.floor(Math.random() * 8));
            btn.classList.add('rnd-choke-active');
            this.updateAllTrackColors();
            this.applyRandomChokeDimming();
        } else {
            this.randomChokeGroups = [];
            btn.classList.remove('rnd-choke-active');
            this.updateAllTrackColors();
            this.clearRandomChokeDimming();
        }
    }
    updateAllTrackColors() { for (let trk = 0; trk < this.tracks.length; trk++) { const normalGroup = Math.floor(trk / TRACKS_PER_GROUP); const effectiveGroup = this.randomChokeMode ? this.randomChokeGroups[trk] : normalGroup; const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`; const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`; if (this.trackLabelElements[trk]) { this.trackLabelElements[trk].style.borderRight = `3px solid ${groupColor}`; this.trackLabelElements[trk].title = `Group ${effectiveGroup}`; } for (let step = 0; step < NUM_STEPS; step++) { if (this.matrixStepElements[trk] && this.matrixStepElements[trk][step]) { const stepEl = this.matrixStepElements[trk][step]; stepEl.style.setProperty('--step-group-color', groupColor); stepEl.style.setProperty('--step-group-color-glow', groupColorGlow); } } } if (this.tracks[this.selectedTrackIndex]) { this.selectTrack(this.selectedTrackIndex, this.visualizerCallback); } }
    applyRandomChokeDimming() { for (let step = 0; step < NUM_STEPS; step++) { const chokeGroupMap = new Map(); for (let t = 0; t < this.tracks.length; t++) { if (this.tracks[t].steps[step]) { const randomGroup = this.randomChokeGroups[t]; if (!chokeGroupMap.has(randomGroup)) chokeGroupMap.set(randomGroup, []); chokeGroupMap.get(randomGroup).push(t); } } chokeGroupMap.forEach((trackIds) => { if (trackIds.length > 1) { const winnerIdx = Math.floor(Math.random() * trackIds.length); trackIds.forEach((trackId, idx) => { const stepEl = this.matrixStepElements[trackId][step]; if (idx === winnerIdx) stepEl.classList.remove('step-dimmed'); else stepEl.classList.add('step-dimmed'); }); } }); } }
    clearRandomChokeDimming() { for (let t = 0; t < this.tracks.length; t++) { for (let step = 0; step < NUM_STEPS; step++) { this.matrixStepElements[t][step].classList.remove('step-dimmed'); } } }
    savePanBaseline() { this.basePanValues = this.tracks.map(t => t.params.pan); }
    applyPanShift(shiftAmount) { this.globalPanShift = shiftAmount; if (this.basePanValues.length === 0) this.savePanBaseline(); const numGroups = 8; for (let i = 0; i < this.tracks.length; i++) { const groupIdx = Math.floor(i / TRACKS_PER_GROUP); const basePan = this.basePanValues[i] || 0; const shiftInGroups = shiftAmount * numGroups; const newGroupPosition = (groupIdx + shiftInGroups) % numGroups; const newGroupCenter = -1 + (newGroupPosition / (numGroups - 1)) * 2; const originalGroupCenter = -1 + (groupIdx / (numGroups - 1)) * 2; const offsetFromCenter = basePan - originalGroupCenter; let newPan = newGroupCenter + offsetFromCenter; newPan = Math.max(-1, Math.min(1, newPan)); this.tracks[i].params.pan = parseFloat(newPan.toFixed(3)); 
    if(this.tracks[i].bus && this.tracks[i].bus.pan) { this.tracks[i].bus.pan.pan.value = newPan; } } }
    toggleMute(trk) { this.tracks[trk].muted = !this.tracks[trk].muted; this.updateTrackStateUI(trk); }
    toggleMuteGroup(grpIdx) { const start = grpIdx * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; const newState = !this.tracks[start]?.muted; for(let i=start; i<end; i++) { if(this.tracks[i]) { this.tracks[i].muted = newState; this.updateTrackStateUI(i); } } }
    toggleSolo(trk) { this.tracks[trk].soloed = !this.tracks[trk].soloed; this.updateTrackStateUI(trk); }
    toggleSoloGroup(grpIdx) { const start = grpIdx * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; const newState = !this.tracks[start]?.soloed; for(let i=start; i<end; i++) { if(this.tracks[i]) { this.tracks[i].soloed = newState; this.updateTrackStateUI(i); } } }
    
    // Toggle Ignore Random property
    toggleIgnoreRandom(trk) {
        this.tracks[trk].ignoreRandom = !this.tracks[trk].ignoreRandom;
        const btn = document.getElementById(`btnX_${trk}`);
        if(this.tracks[trk].ignoreRandom) btn.classList.add('exclude-active');
        else btn.classList.remove('exclude-active');
    }

    updateTrackStateUI(trk) { 
        const t = this.tracks[trk]; 
        const btnM = document.getElementById(`btnM_${trk}`); 
        const btnS = document.getElementById(`btnS_${trk}`); 
        const btnL = document.getElementById(`btnL_${trk}`); 
        const btnX = document.getElementById(`btnX_${trk}`);
        
        if(t.muted) btnM.classList.add('mute-active'); else btnM.classList.remove('mute-active'); 
        if(t.soloed) btnS.classList.add('solo-active'); else btnS.classList.remove('solo-active'); 
        if(t.stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active'); 
        if(btnX) { if(t.ignoreRandom) btnX.classList.add('exclude-active'); else btnX.classList.remove('exclude-active'); }
        
        if(this.trackRowElements[trk]) this.trackRowElements[trk].forEach(el => el.style.opacity = t.muted ? '0.4' : '1.0'); 
    }
    
    clearTrack(trk) { 
        if(this.tracks[trk].type === 'automation') {
             this.tracks[trk].steps.fill(0);
        } else {
             this.tracks[trk].steps.fill(false); 
        }
        for(let s=0; s<NUM_STEPS; s++) if(this.matrixStepElements[trk] && this.matrixStepElements[trk][s]) {
             this.matrixStepElements[trk][s].classList.remove('active', 'auto-level-1', 'auto-level-2', 'auto-level-3', 'auto-level-4', 'auto-level-5'); 
        }
    }
    clearGroup(grp) { const start = grp * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; for(let i=start; i<end; i++) if(this.tracks[i]) this.clearTrack(i); }
    
    toggleStep(trk, step) { 
        const track = this.tracks[trk];
        const btn = this.matrixStepElements[trk][step];

        // --- AUTOMATION TRACK LOGIC ---
        if (track.type === 'automation') {
             let val = track.steps[step];
             // Cycle 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0
             val = (val + 1) % 6;
             track.steps[step] = val;
             
             // Cleanup old classes
             btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
             btn.classList.remove('active');
             
             if (val > 0) {
                 btn.classList.add('active');
                 btn.classList.add(`auto-level-${val}`);
             }
             return; // Skip normal group logic for automation
        }

        // --- NORMAL AUDIO TRACK LOGIC ---
        const newState = !this.tracks[trk].steps[step]; 
        if (newState) { 
            const groupStart = Math.floor(trk / TRACKS_PER_GROUP) * TRACKS_PER_GROUP; 
            const groupEnd = groupStart + TRACKS_PER_GROUP; 
            for(let i=groupStart; i<groupEnd; i++) { 
                if (this.tracks[i] && i !== trk && this.tracks[i].steps[step] && this.tracks[i].type !== 'automation') { 
                    if (!this.tracks[i].stepLock) { 
                        this.tracks[i].steps[step] = false; 
                        this.matrixStepElements[i][step].classList.remove('active'); 
                    } else { 
                        return; 
                    } 
                } 
            } 
        } 
        this.tracks[trk].steps[step] = newState; 
        if(newState) btn.classList.add('active'); else btn.classList.remove('active'); 
        if (this.randomChokeMode) this.applyRandomChokeDimming(); 
    }

    randomizeTrackPattern(trkIdx) { 
        const t = this.tracks[trkIdx]; 
        // Logic variation for automation
        if(t.type === 'automation') {
             for(let i=0; i<NUM_STEPS; i++) {
                 // 30% chance of a value, weighted towards lower numbers
                 const roll = Math.random();
                 let val = 0;
                 if (roll < 0.3) {
                      val = Math.floor(Math.random() * 5) + 1;
                 }
                 t.steps[i] = val;
                 const btn = this.matrixStepElements[trkIdx][i];
                 btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
                 btn.classList.remove('active');
                 if(val > 0) {
                     btn.classList.add('active', `auto-level-${val}`);
                 }
             }
             return;
        }

        const groupStart = Math.floor(trkIdx / TRACKS_PER_GROUP) * TRACKS_PER_GROUP; 
        const groupEnd = groupStart + TRACKS_PER_GROUP; 
        for(let i=0; i<NUM_STEPS; i++) { 
            const active = Math.random() < 0.25; 
            if (active) { 
                let isStepLocked = false; 
                for(let sib=groupStart; sib<groupEnd; sib++) { 
                    if(this.tracks[sib] && sib !== trkIdx && this.tracks[sib].steps[i] && this.tracks[sib].stepLock) { 
                        isStepLocked = true; break; 
                    } 
                } 
                if (!isStepLocked) { 
                    for(let sib=groupStart; sib<groupEnd; sib++) { 
                        if(this.tracks[sib] && sib !== trkIdx && this.tracks[sib].steps[i] && !this.tracks[sib].stepLock && this.tracks[sib].type !== 'automation') { 
                            this.tracks[sib].steps[i] = false; 
                            this.matrixStepElements[sib][i].classList.remove('active'); 
                        } 
                    } 
                    t.steps[i] = active; 
                } else { t.steps[i] = false; } 
            } else { t.steps[i] = false; } 
            const btn = this.matrixStepElements[trkIdx][i]; 
            if(t.steps[i]) btn.classList.add('active'); else btn.classList.remove('active'); 
        } 
        if (this.randomChokeMode) this.applyRandomChokeDimming(); 
    }

    randomizeAllPatterns() { for (let step = 0; step < NUM_STEPS; step++) { const numGroups = Math.ceil(this.tracks.length / TRACKS_PER_GROUP); for (let g = 0; g < numGroups; g++) { const groupStart = g * TRACKS_PER_GROUP; const plays = Math.random() < 0.4; const activeTrackOffset = Math.floor(Math.random() * TRACKS_PER_GROUP); const activeTrackId = groupStart + activeTrackOffset; for (let i = 0; i < TRACKS_PER_GROUP; i++) { const trkId = groupStart + i; if (!this.tracks[trkId]) continue; const shouldBeActive = plays && (trkId === activeTrackId); this.tracks[trkId].steps[step] = shouldBeActive; const btn = this.matrixStepElements[trkId][step]; if(shouldBeActive) btn.classList.add('active'); else btn.classList.remove('active'); } } } if (this.randomChokeMode) this.applyRandomChokeDimming(); }

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
                if(param === 'scanSpeed') suffix = '';
                if(el.nextElementSibling) {
                    el.nextElementSibling.innerText = t.params[param].toFixed(2) + suffix;
                }
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
        const btn = document.getElementById('snapshotBtn');
        if(!this.snapshotData) {
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: {...t.params},
                    steps: [...t.steps],
                    muted: t.muted,
                    soloed: t.soloed,
                    stepLock: t.stepLock,
                    ignoreRandom: t.ignoreRandom,
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
                    t.steps = [...trackData.steps];
                    t.muted = trackData.muted;
                    t.soloed = trackData.soloed;
                    t.stepLock = trackData.stepLock || false;
                    t.ignoreRandom = trackData.ignoreRandom || false; 
                    trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave;
                            t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount;
                            t.lfos[lIdx].target = lData.target;
                        }
                    });
                    this.updateTrackStateUI(i);
                    for(let s=0; s<NUM_STEPS; s++) {
                         const btn = this.matrixStepElements[i][s];
                         // Reset classes
                         btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
                         btn.classList.remove('active');
                         
                         if(t.type === 'automation') {
                             if(t.steps[s] > 0) btn.classList.add('active', `auto-level-${t.steps[s]}`);
                         } else {
                             if(t.steps[s]) btn.classList.add('active');
                         }
                    }
                    
                    if(t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                    if(t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                    if(t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if(t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                });
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                this.selectTrack(this.selectedTrackIndex, this.visualizerCallback);
            } catch(e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }

    clearPlayheadForStop() {
        for(let t=0; t<this.tracks.length; t++) {
            for(let s=0; s<NUM_STEPS; s++) {
                if(this.matrixStepElements[t] && this.matrixStepElements[t][s])
                    this.matrixStepElements[t][s].classList.remove('step-playing');
            }
        }
    }
}