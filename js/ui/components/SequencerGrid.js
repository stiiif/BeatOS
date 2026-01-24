import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../events/Events.js';

export class SequencerGrid {
    constructor(containerId, trackManager) {
        this.container = document.getElementById(containerId);
        this.headerContainer = document.getElementById('stepHeaders');
        this.trackManager = trackManager;
        this.tracks = trackManager.getTracks();
        
        // State
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.selectedTrackIndex = 0;

        // Bind internal methods
        this.handleStepClick = this.handleStepClick.bind(this);
        this.handleTrackSelect = this.handleTrackSelect.bind(this);

        this.initEvents();
        this.renderHeader();
        this.renderInitialRows();
    }

    initEvents() {
        // Listen for playback step to update playhead
        globalBus.on(EVENTS.PLAYBACK_STEP, (data) => this.updatePlayhead(data.step, data.total));
        
        // Listen for track updates (e.g. from adding new tracks)
        globalBus.on(EVENTS.TRACK_ADDED, (trackId) => this.appendTrackRow(trackId));
        
        // Listen for global selection changes (if initiated elsewhere)
        globalBus.on(EVENTS.TRACK_SELECTED, (index) => {
            this.selectedTrackIndex = index;
            this.highlightSelectedTrack(index);
        });

        // Listen for pattern randomization requests
        globalBus.on(EVENTS.PATTERN_RANDOMIZED, () => {
            this.refreshGridState();
        });
    }

    renderHeader() {
        if (!this.headerContainer) return;
        this.headerContainer.innerHTML = '';
        this.headerContainer.className = 'sequencer-grid sticky top-0 bg-neutral-950 z-30 pb-2 border-b border-neutral-800 pt-2';

        const trkHeader = document.createElement('div');
        trkHeader.className = 'header-cell font-bold';
        trkHeader.innerText = 'TRK';
        this.headerContainer.appendChild(trkHeader);

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
            this.headerContainer.appendChild(div);
        }

        const rndHeader = document.createElement('div');
        rndHeader.className = 'header-cell';
        rndHeader.innerHTML = '<i class="fas fa-dice"></i>';
        this.headerContainer.appendChild(rndHeader);

        const actHeader = document.createElement('div');
        actHeader.className = 'header-cell';
        actHeader.innerText = 'ACTIONS';
        this.headerContainer.appendChild(actHeader);

        const visHeader = document.createElement('div');
        visHeader.className = 'header-cell';
        visHeader.innerText = 'VIS';
        this.headerContainer.appendChild(visHeader);
    }

    renderInitialRows() {
        if (!this.container) return;
        // Clear existing rows but keep the button row if it exists (it might be managed by parent)
        // For safety, let's assume container is empty or we append to it.
        // In the original, there was a button row. We will handle rows specifically.
        this.tracks.forEach(t => {
            if (!this.trackRowElements[t.id]) {
                this.appendTrackRow(t.id);
            }
        });
    }

    appendTrackRow(trkId) {
        if (!this.container) return;
        
        // Find the button row to insert before, if it exists
        const buttonRow = document.getElementById('matrixButtonRow');
        
        const trackObj = this.tracks[trkId];
        const groupIdx = Math.floor(trkId / TRACKS_PER_GROUP);
        
        // Basic group color logic (can be refined with randomChokeMode later)
        const effectiveGroup = groupIdx; 
        const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'sequencer-grid'; 
        rowDiv.id = `track-row-${trkId}`;
        const rowElements = [];
        
        // 1. Label
        const label = document.createElement('div');
        label.className = `track-label ${trkId===this.selectedTrackIndex ? 'selected' : ''}`;
        const displayNum = trkId + 1;
        label.innerText = displayNum < 10 ? `0${displayNum}` : displayNum;
        label.title = `Group ${effectiveGroup}`;
        label.onclick = () => this.handleTrackSelect(trkId);
        label.style.borderRight = `3px solid ${groupColor}`;
        rowDiv.appendChild(label);
        this.trackLabelElements[trkId] = label;
        this.matrixStepElements[trkId] = [];
        rowElements.push(label);

        // 2. Steps
        for(let step=0; step<NUM_STEPS; step++) {
            const btn = document.createElement('div');
            btn.className = 'step-btn';
            btn.dataset.step = step;
            btn.dataset.track = trkId;
            btn.onclick = () => this.handleStepClick(trkId, step);
            btn.style.setProperty('--step-group-color', groupColor);
            btn.style.setProperty('--step-group-color-glow', groupColorGlow);
            
            if ((step + 1) % 16 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('bar-divider');
            } else if ((step + 1) % 4 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('beat-divider');
            }
            
            // Initial State Render
            this.updateStepVisual(btn, trackObj, step);

            rowDiv.appendChild(btn);
            this.matrixStepElements[trkId][step] = btn;
            rowElements.push(btn);
        }

        // 3. Random Button
        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.onclick = () => this.randomizeTrack(trkId);
        rowDiv.appendChild(rndBtn);
        rowElements.push(rndBtn);

        // 4. Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'track-actions';
        // (Simplified action creation for brevity, logic remains similar)
        this.createActionButtons(actionsDiv, trkId, groupIdx, trackObj);
        rowDiv.appendChild(actionsDiv);
        rowElements.push(actionsDiv);

        // 5. Visualizer Canvas
        const visCanvas = document.createElement('canvas');
        visCanvas.className = 'track-vis-canvas';
        visCanvas.id = `vis-canvas-${trkId}`;
        visCanvas.width = 40; 
        visCanvas.height = 16;
        visCanvas.style.cursor = 'pointer';
        visCanvas.onclick = () => this.handleTrackSelect(trkId);
        rowDiv.appendChild(visCanvas);
        rowElements.push(visCanvas);
        
        if (buttonRow) {
            this.container.insertBefore(rowDiv, buttonRow);
        } else {
            this.container.appendChild(rowDiv);
        }
        this.trackRowElements[trkId] = rowElements;
    }

    createActionButtons(container, trkId, groupIdx, trackObj) {
        const createAction = (txt, fn, title, cls='', id='') => {
            const b = document.createElement('button');
            b.className = 'action-btn ' + cls;
            b.innerHTML = txt; b.title = title;
            if(id) b.id = id;
            b.onclick = (e) => { e.stopPropagation(); fn(trkId); };
            return b;
        };

        container.appendChild(createAction('L', () => this.toggleTrackState(trkId, 'stepLock'), 'Lock Steps', '', `btnL_${trkId}`));
        container.appendChild(createAction('M', () => this.toggleTrackState(trkId, 'muted'), 'Mute Track', '', `btnM_${trkId}`));
        container.appendChild(createAction('Mg', () => this.toggleGroupState(groupIdx, 'muted'), 'Mute Group'));
        container.appendChild(createAction('S', () => this.toggleTrackState(trkId, 'soloed'), 'Solo Track', '', `btnS_${trkId}`));
        container.appendChild(createAction('Sg', () => this.toggleGroupState(groupIdx, 'soloed'), 'Solo Group'));
        container.appendChild(createAction('C', () => this.clearTrack(trkId), 'Clear Track', 'erase'));
        container.appendChild(createAction('Cg', () => this.clearGroup(groupIdx), 'Clear Group', 'erase'));
        
        const btnX = createAction('X', () => this.toggleTrackState(trkId, 'ignoreRandom'), 'Exclude from Auto Randomization', '', `btnX_${trkId}`);
        if(trackObj.ignoreRandom) btnX.classList.add('exclude-active');
        container.appendChild(btnX);
        
        // Initial state sync
        this.updateTrackStateVisuals(trkId);
    }

    handleStepClick(trkId, step) {
        const track = this.tracks[trkId];
        const btn = this.matrixStepElements[trkId][step];

        if (track.type === 'automation') {
             let val = track.steps[step];
             val = (val + 1) % 6;
             track.steps[step] = val;
        } else {
            // V2 Cycle: 0 -> 2 (Normal) -> 3 (Accent) -> 1 (Ghost) -> 0
            let val = track.steps[step];
            let nextVal = 0;
            if (val === 0) nextVal = 2;
            else if (val === 2) nextVal = 3;
            else if (val === 3) nextVal = 1;
            else if (val === 1) nextVal = 0;
            track.steps[step] = nextVal;
        }
        
        this.updateStepVisual(btn, track, step);
        globalBus.emit(EVENTS.STEP_TOGGLED, { track: trkId, step });
    }

    updateStepVisual(btn, track, step) {
        // Reset classes
        btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3', 'auto-level-1', 'auto-level-2', 'auto-level-3', 'auto-level-4', 'auto-level-5');
        
        const val = track.steps[step];
        if (val > 0) {
            if (track.type === 'automation') {
                btn.classList.add('active', `auto-level-${val}`);
            } else {
                btn.classList.add(`vel-${val}`);
            }
        }
    }

    handleTrackSelect(trkId) {
        if (this.selectedTrackIndex === trkId) return;
        this.selectedTrackIndex = trkId;
        globalBus.emit(EVENTS.TRACK_SELECTED, trkId);
    }

    highlightSelectedTrack(index) {
        this.trackLabelElements.forEach((el, i) => {
            if (i === index) el.classList.add('selected');
            else el.classList.remove('selected');
        });
    }

    updatePlayhead(step, totalStepsPlayed) {
        for(let t=0; t<this.tracks.length; t++) {
            const track = this.tracks[t];
            const div = track.clockDivider || 1;
            
            const currentLit = this.matrixStepElements[t].filter(el => el.classList.contains('step-playing'));
            currentLit.forEach(el => el.classList.remove('step-playing'));
            
            const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
            const currentEffective = Math.floor(totalStepsPlayed / div) % trackLength;
            
            if(this.matrixStepElements[t] && this.matrixStepElements[t][currentEffective]) {
                this.matrixStepElements[t][currentEffective].classList.add('step-playing');
            }
        }
    }

    // --- Actions ---

    toggleTrackState(trkId, property) {
        const t = this.tracks[trkId];
        t[property] = !t[property];
        this.updateTrackStateVisuals(trkId);
        globalBus.emit(EVENTS.TRACK_STATE_CHANGED, { track: trkId, state: property, value: t[property] });
    }

    toggleGroupState(grpIdx, property) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        const newState = !this.tracks[start]?.[property];
        
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) {
                this.tracks[i][property] = newState;
                this.updateTrackStateVisuals(i);
            }
        }
    }

    clearTrack(trkId) {
        this.tracks[trkId].steps.fill(0);
        this.refreshTrackRow(trkId);
    }

    clearGroup(grpIdx) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) this.clearTrack(i);
        }
    }

    randomizeTrack(trkId) {
        // Simple randomization logic (can be moved to a helper or event driven later)
        const t = this.tracks[trkId];
        if (t.type === 'automation') {
             for(let i=0; i<NUM_STEPS; i++) t.steps[i] = Math.random() < 0.3 ? Math.floor(Math.random()*5)+1 : 0;
        } else {
             for(let i=0; i<NUM_STEPS; i++) {
                 if (t.stepLock) continue;
                 const active = Math.random() < 0.25;
                 if (active) {
                     const rnd = Math.random();
                     t.steps[i] = rnd > 0.8 ? 3 : (rnd < 0.2 ? 1 : 2);
                 } else {
                     t.steps[i] = 0;
                 }
             }
        }
        this.refreshTrackRow(trkId);
    }

    refreshTrackRow(trkId) {
        for(let s=0; s<NUM_STEPS; s++) {
            this.updateStepVisual(this.matrixStepElements[trkId][s], this.tracks[trkId], s);
        }
    }
    
    refreshGridState() {
        this.tracks.forEach((_, i) => this.refreshTrackRow(i));
    }

    updateTrackStateVisuals(trkId) {
        const t = this.tracks[trkId];
        const btnM = document.getElementById(`btnM_${trkId}`);
        const btnS = document.getElementById(`btnS_${trkId}`);
        const btnL = document.getElementById(`btnL_${trkId}`);
        const btnX = document.getElementById(`btnX_${trkId}`);

        if(btnM) t.muted ? btnM.classList.add('mute-active') : btnM.classList.remove('mute-active');
        if(btnS) t.soloed ? btnS.classList.add('solo-active') : btnS.classList.remove('solo-active');
        if(btnL) t.stepLock ? btnL.classList.add('lock-active') : btnL.classList.remove('lock-active');
        if(btnX) t.ignoreRandom ? btnX.classList.add('exclude-active') : btnX.classList.remove('exclude-active');

        if(this.trackRowElements[trkId]) {
            this.trackRowElements[trkId].forEach(el => el.style.opacity = t.muted ? '0.4' : '1.0');
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