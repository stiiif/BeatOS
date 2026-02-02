// js/ui/components/SequencerGrid.js
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';

export class SequencerGrid {
    constructor() {
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
        this.tracks = [];
        this.audioEngine = null; // Needs reference for updates
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
    
    // Helper to inject engine
    setAudioEngine(engine) {
        this.audioEngine = engine;
    }

    initializeGrid(addTrackCallback, addGroupCallback, getSelectedTrackIndex, onToggleStep) {
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
        
        this.renderHeaders();
        this.renderButtonRow(addTrackCallback, addGroupCallback);
        this.bindKeyboardShortcuts(getSelectedTrackIndex, onToggleStep);
    }

    renderHeaders() {
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
            div.id = `header-step-${i}`;
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('bar-divider');
            } else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('beat-divider');
            }
            
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

        const visHeader = document.createElement('div');
        visHeader.className = 'header-cell';
        visHeader.innerText = 'VIS';
        headerContainer.appendChild(visHeader);
    }

    renderButtonRow(addTrackCallback, addGroupCallback) {
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
    }

    bindKeyboardShortcuts(getSelectedTrackIndex, onToggleStep) {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (this.keyMapping.hasOwnProperty(e.code)) {
                const stepIndex = this.keyMapping[e.code];
                const currentTrackId = getSelectedTrackIndex();
                if (currentTrackId >= 0 && currentTrackId < this.tracks.length) {
                    if(stepIndex < NUM_STEPS) {
                        onToggleStep(currentTrackId, stepIndex);
                    }
                }
            }
        });
    }

    appendTrackRow(trk, visualizerCallback, randomChokeMode, randomChokeGroups, onToggleStep, onToggleMute, onToggleSolo, onToggleStepLock, onToggleMuteGroup, onToggleSoloGroup, onClearTrack, onClearGroup, onToggleIgnoreRandom, onToggleIgnoreVelocityParams, onRandomizeTrack, onSelectTrack) {
        const container = document.getElementById('matrixContainer');
        const buttonRow = document.getElementById('matrixButtonRow');
        const trackObj = this.tracks[trk];
        const groupIdx = Math.floor(trk / TRACKS_PER_GROUP);
        
        const effectiveGroup = randomChokeMode ? randomChokeGroups[trk] : groupIdx;
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
        label.onclick = () => onSelectTrack(trk, visualizerCallback);
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
            btn.onclick = () => onToggleStep(trk, step);
            btn.style.setProperty('--step-group-color', groupColor);
            btn.style.setProperty('--step-group-color-glow', groupColorGlow);
            
            if ((step + 1) % 16 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('bar-divider');
            } else if ((step + 1) % 4 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('beat-divider');
            }
            
            if (trackObj.type === 'automation') {
                const val = trackObj.steps[step];
                if (val > 0) {
                    btn.classList.add('active');
                    btn.classList.add(`auto-level-${val}`);
                }
            } else {
                const val = trackObj.steps[step];
                if (val > 0) {
                    btn.classList.add(`vel-${val}`);
                }
            }

            rowDiv.appendChild(btn);
            this.matrixStepElements[trk][step] = btn;
            rowElements.push(btn);
        }

        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.onclick = () => onRandomizeTrack(trk);
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
        const btnM = createAction('M', (t) => onToggleMute(t), 'Mute Track'); btnM.id = `btnM_${trk}`;
        const btnS = createAction('S', (t) => onToggleSolo(t), 'Solo Track'); btnS.id = `btnS_${trk}`;
        const btnL = createAction('L', (t) => onToggleStepLock(t), 'Lock Steps'); btnL.id = `btnL_${trk}`;
        
        // NEW Button V
        const btnV = createAction('V', (t) => onToggleIgnoreVelocityParams(t), 'Deactivate Velocity Params (Keep Gain)', 'vel-params');
        btnV.id = `btnV_${trk}`;
        if(trackObj.ignoreVelocityParams) btnV.classList.add('ignore-vel-active');

        actionsDiv.appendChild(btnL); 
        actionsDiv.appendChild(btnV); // Insert next to lock
        actionsDiv.appendChild(btnM);
        actionsDiv.appendChild(createAction('Mg', () => onToggleMuteGroup(groupIdx), 'Mute Group'));
        actionsDiv.appendChild(btnS);
        actionsDiv.appendChild(createAction('Sg', () => onToggleSoloGroup(groupIdx), 'Solo Group'));
        actionsDiv.appendChild(createAction('C', () => onClearTrack(trk), 'Clear Track', 'erase'));
        actionsDiv.appendChild(createAction('Cg', () => onClearGroup(groupIdx), 'Clear Group', 'erase'));
        
        const btnX = createAction('X', (t) => onToggleIgnoreRandom(t), 'Exclude from Auto Randomization (Rand Prms)');
        btnX.id = `btnX_${trk}`;
        if(trackObj.ignoreRandom) btnX.classList.add('exclude-active');
        actionsDiv.appendChild(btnX);

        rowDiv.appendChild(actionsDiv);
        rowElements.push(actionsDiv);

        const visCanvas = document.createElement('canvas');
        visCanvas.className = 'track-vis-canvas';
        visCanvas.id = `vis-canvas-${trk}`;
        visCanvas.width = 40; 
        visCanvas.height = 16;
        
        visCanvas.style.cursor = 'pointer';
        visCanvas.onclick = () => onSelectTrack(trk, visualizerCallback);

        rowDiv.appendChild(visCanvas);
        rowElements.push(visCanvas);
        
        if (buttonRow) container.insertBefore(rowDiv, buttonRow); else container.appendChild(rowDiv);
        this.trackRowElements[trk] = rowElements;
    }

    toggleStep(trk, step, onApplyRandomChokeDimming, randomChokeMode) { 
        const track = this.tracks[trk];
        const btn = this.matrixStepElements[trk][step];

        if (track.type === 'automation') {
             let val = track.steps[step];
             val = (val + 1) % 6;
             track.steps[step] = val;
             btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
             btn.classList.remove('active');
             if (val > 0) {
                 btn.classList.add('active');
                 btn.classList.add(`auto-level-${val}`);
             }
             return; 
        }

        let val = track.steps[step];
        let nextVal = 0;
        
        if (val === 0) nextVal = 2; // Off -> Normal
        else if (val === 2) nextVal = 3; // Normal -> Accent
        else if (val === 3) nextVal = 1; // Accent -> Ghost
        else if (val === 1) nextVal = 0; // Ghost -> Off
        
        track.steps[step] = nextVal;
        
        // V5: Sync to Shared Memory
        if (this.audioEngine) {
            this.audioEngine.updateTrackStep(trk, step, nextVal);
        }
        
        btn.classList.remove('vel-1', 'vel-2', 'vel-3');
        if (nextVal > 0) {
            btn.classList.add(`vel-${nextVal}`);
        }
        
        if (randomChokeMode) onApplyRandomChokeDimming(); 
    }

    updateMatrixHead(currentStep, totalStepsPlayed) {
        const masterStep = (typeof totalStepsPlayed !== 'undefined') ? totalStepsPlayed : currentStep;

        for(let t=0; t<this.tracks.length; t++) {
            const track = this.tracks[t];
            const div = track.clockDivider || 1;
            
            if (!this.matrixStepElements[t]) continue;
            
            const currentLit = this.matrixStepElements[t].filter(el => el.classList.contains('step-playing'));
            currentLit.forEach(el => el.classList.remove('step-playing'));
            
            const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
            const currentEffective = Math.floor(masterStep / div) % trackLength;
            
            if(this.matrixStepElements[t] && this.matrixStepElements[t][currentEffective]) {
                this.matrixStepElements[t][currentEffective].classList.add('step-playing');
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

    updateGridVisuals(timeSig) {
        for(let i=0; i<NUM_STEPS; i++) {
            const div = document.getElementById(`header-step-${i}`);
            if(div) {
                div.classList.remove('beat-divider', 'bar-divider', 'triplet-divider');
                if (timeSig === '12/8' || timeSig === '6/8') {
                     if ((i + 1) % 12 === 0 && i !== NUM_STEPS - 1) div.classList.add('bar-divider');
                     else if ((i + 1) % 3 === 0 && i !== NUM_STEPS - 1) div.classList.add('triplet-divider');
                } else {
                    if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) div.classList.add('bar-divider');
                    else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) div.classList.add('beat-divider');
                }
            }
            
            this.tracks.forEach((t, tIdx) => {
                const btn = this.matrixStepElements[tIdx][i];
                if(btn) {
                    btn.classList.remove('beat-divider', 'bar-divider', 'triplet-divider');
                    if (timeSig === '12/8' || timeSig === '6/8') {
                        if ((i + 1) % 12 === 0 && i !== NUM_STEPS - 1) btn.classList.add('bar-divider');
                        else if ((i + 1) % 3 === 0 && i !== NUM_STEPS - 1) btn.classList.add('triplet-divider');
                    } else {
                        if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) btn.classList.add('bar-divider');
                        else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) btn.classList.add('beat-divider');
                    }
                }
            });
        }
    }

    getMatrixStepElements() { return this.matrixStepElements; }
    getTrackLabelElements() { return this.trackLabelElements; }
    getTrackRowElements() { return this.trackRowElements; }
}