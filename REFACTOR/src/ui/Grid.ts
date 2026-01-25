import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import { store } from '../state/Store';
import { AppState, TrackState } from '../types/state';
import { ActionTypes } from '../state/actions';
import { NUM_STEPS, TRACKS_PER_GROUP } from '../config/constants';

export class Grid extends Component {
    private container: HTMLElement;
    private headerContainer: HTMLElement;
    private trackLabelElements: HTMLElement[] = [];
    private stepElements: HTMLElement[][] = []; // [trackId][stepId]
    private keyMapping: Record<string, number>;

    constructor() {
        super();
        this.container = document.getElementById(DOM_IDS.GRID.CONTAINER)!;
        this.headerContainer = document.getElementById(DOM_IDS.GRID.HEADERS)!;
        
        // Piano-style layout for keyboard shortcuts
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

        this.initGrid();
        this.bindEvents();
    }

    private initGrid() {
        // Initialize Headers
        this.headerContainer.innerHTML = '';
        
        // TRK Header
        const trkHeader = document.createElement('div');
        trkHeader.className = 'header-cell font-bold';
        trkHeader.innerText = 'TRK';
        this.headerContainer.appendChild(trkHeader);

        // Step Headers
        for (let i = 0; i < NUM_STEPS; i++) {
            const div = document.createElement('div');
            div.className = 'header-cell';
            div.innerText = (i + 1).toString();
            div.id = `header-step-${i}`;
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('bar-divider');
            } else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('beat-divider');
            }
            this.headerContainer.appendChild(div);
        }

        // RND, Actions, Vis Headers
        const headers = ['<i class="fas fa-dice"></i>', 'ACTIONS', 'VIS'];
        headers.forEach(h => {
            const div = document.createElement('div');
            div.className = 'header-cell';
            div.innerHTML = h;
            this.headerContainer.appendChild(div);
        });
    }

    private bindEvents() {
        // Event Delegation for the entire matrix
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            // 1. Step Buttons
            const stepBtn = target.closest('.step-btn') as HTMLElement;
            if (stepBtn) {
                const trackId = parseInt(stepBtn.dataset.track!);
                const stepId = parseInt(stepBtn.dataset.step!);
                store.dispatch({
                    type: ActionTypes.TOGGLE_STEP,
                    payload: { trackId, stepId }
                });
                return;
            }

            // 2. Track Selection (Label)
            const label = target.closest('.track-label') as HTMLElement;
            if (label && label.dataset.track) {
                const trackId = parseInt(label.dataset.track);
                store.dispatch({ type: ActionTypes.SELECT_TRACK, payload: trackId });
                return;
            }

            // 3. Track Actions (Mute, Solo, etc)
            const actionBtn = target.closest('.action-btn') as HTMLElement;
            if (actionBtn && actionBtn.dataset.action && actionBtn.dataset.track) {
                const trackId = parseInt(actionBtn.dataset.track);
                const action = actionBtn.dataset.action;
                
                // Map DOM action to Store action
                const type = {
                    'mute': ActionTypes.TOGGLE_MUTE,
                    'solo': ActionTypes.TOGGLE_SOLO,
                    'lock': ActionTypes.TOGGLE_LOCK,
                    'clear': ActionTypes.CLEAR_TRACK,
                    'ignore': ActionTypes.TOGGLE_IGNORE_RANDOM
                }[action];

                if (type) {
                    store.dispatch({ type, payload: trackId });
                }
                return;
            }
            
            // 4. Randomize Pattern
            const rndBtn = target.closest('.track-rnd-btn') as HTMLElement;
            if (rndBtn && rndBtn.dataset.track) {
                // We'll need a thunk or logic here to generate the pattern
                // For now, simpler: dispatch specific randomize action caught by reducer or middleware
                // Since our reducer doesn't implement RNG logic usually, we might need a service call.
                // But for pure Flux, let's assume the reducer or a middleware handles "RANDOMIZE_TRACK_PATTERN".
                // We'll implement a basic randomizer in the reducer for TOGGLE_STEP or a new action.
                // Let's create a helper in the reducer later. For now, trigger generic update.
                // Or better: The Component handles the math and dispatches SET_STEP_VALUE in a loop?
                // No, logic should be outside components. 
                // We will dispatch a new action type "RANDOMIZE_PATTERN" that the reducer handles.
                // Note: We need to add this to ActionTypes if not present. Assuming it is or we add it.
                // For this refactor, we'll implement it as multiple dispatch or a complex action.
                
                // Let's implement client-side logic here to match original UIManager behavior
                // then dispatch bulk update.
                const trackId = parseInt(rndBtn.dataset.track);
                this.randomizeTrack(trackId);
            }
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            
            if (this.keyMapping.hasOwnProperty(e.code)) {
                const stepIndex = this.keyMapping[e.code];
                const state = store.getState();
                const currentTrackId = state.ui.selectedTrackId;
                
                if (currentTrackId >= 0 && stepIndex < NUM_STEPS) {
                    store.dispatch({
                        type: ActionTypes.TOGGLE_STEP,
                        payload: { trackId: currentTrackId, stepId: stepIndex }
                    });
                }
            }
        });
    }

    private randomizeTrack(trackId: number) {
        // Simple client-side randomizer logic ported from UIManager
        // This keeps the component "dumb" about audio but smart about user intent
        const steps = new Array(NUM_STEPS).fill(0);
        for(let i=0; i<NUM_STEPS; i++) {
            if (Math.random() < 0.25) {
                const rnd = Math.random();
                let vel = 2; // Normal
                if (rnd > 0.8) vel = 3; // Accent
                else if (rnd < 0.2) vel = 1; // Ghost
                steps[i] = vel;
            }
        }
        
        // Dispatch multiple updates or a bulk update if we had one. 
        // For efficiency, we just loop dispatches or (better) add a BULK_SET_STEPS action.
        // We'll simulate via loop for now as per current actions.
        // Actually, let's assume we can add 'SET_PATTERN' to actions for efficiency.
        // For strict adherence to current defined actions, we iterate.
        steps.forEach((val, stepId) => {
             // Only dispatch if different to save cycles? Or just set.
             // We don't have SET_STEP in our basic list, only TOGGLE.
             // We need to implement proper SET logic or toggle until match (bad).
             // Let's assume we add SET_STEP_VALUE to actions.ts as proposed in Phase 2.
             store.dispatch({
                 type: ActionTypes.SET_STEP_VALUE,
                 payload: { trackId, stepId, value: val }
             });
        });
    }

    render(state: AppState) {
        // 1. Sync Track Rows (Virtual DOM-lite)
        // If track count changed, rebuild grid.
        if (this.trackLabelElements.length !== state.tracks.length) {
            this.rebuildGrid(state.tracks);
        }

        // 2. Update Cells
        state.tracks.forEach((track, tIdx) => {
            // Update Label Selection
            const isSelected = tIdx === state.ui.selectedTrackId;
            const label = this.trackLabelElements[tIdx];
            if (label) {
                if (isSelected) label.classList.add('selected');
                else label.classList.remove('selected');
                
                // Group Color Logic
                const groupIdx = Math.floor(tIdx / TRACKS_PER_GROUP);
                // Note: Choke groups might override color in original, here we stick to simple grouping
                const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
                label.style.borderRight = `3px solid ${groupColor}`;
            }

            // Update Steps
            const trackSteps = this.stepElements[tIdx];
            if (trackSteps) {
                trackSteps.forEach((el, sIdx) => {
                    // Reset classes
                    el.className = 'step-btn';
                    
                    // Add divider classes
                    if ((sIdx + 1) % 16 === 0 && sIdx !== NUM_STEPS - 1) el.classList.add('bar-divider');
                    else if ((sIdx + 1) % 4 === 0 && sIdx !== NUM_STEPS - 1) el.classList.add('beat-divider');

                    // Playhead
                    if (sIdx === state.transport.currentStep) {
                        el.classList.add('step-playing');
                    }

                    // Value/Velocity
                    const val = track.steps[sIdx];
                    if (val > 0) {
                        if (track.type === 'automation') {
                            el.classList.add('active', `auto-level-${val}`);
                        } else {
                            el.classList.add(`vel-${val}`);
                        }
                    }
                    
                    // CSS Variables for color
                    const groupIdx = Math.floor(tIdx / TRACKS_PER_GROUP);
                    const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
                    el.style.setProperty('--step-group-color', groupColor);
                });
            }
            
            // Update Action Buttons State
            const row = this.trackLabelElements[tIdx]?.parentElement;
            if (row) {
                const btnM = row.querySelector(`[data-action="mute"]`);
                const btnS = row.querySelector(`[data-action="solo"]`);
                const btnL = row.querySelector(`[data-action="lock"]`);
                
                if (track.triggers.muted) btnM?.classList.add('mute-active'); else btnM?.classList.remove('mute-active');
                if (track.triggers.soloed) btnS?.classList.add('solo-active'); else btnS?.classList.remove('solo-active');
                if (track.triggers.locked) btnL?.classList.add('lock-active'); else btnL?.classList.remove('lock-active');
                
                // Mute Opacity
                if (track.triggers.muted) row.classList.add('row-muted'); else row.classList.remove('row-muted');
            }
        });
        
        // 3. Update Header Playhead
        for(let i=0; i<NUM_STEPS; i++) {
            const h = document.getElementById(`header-step-${i}`);
            if(h) {
                if (i === state.transport.currentStep) h.classList.add('text-emerald-400');
                else h.classList.remove('text-emerald-400');
            }
        }
    }

    private rebuildGrid(tracks: TrackState[]) {
        // Clear logic would go here, but since we append to the same container
        // we need to be careful not to kill the Add Buttons if they are in the same container.
        // In the original, buttons are separate.
        
        // We will clear just the rows we manage.
        // Ideally we'd use a diffing algo, but for 32 tracks, a full rebuild is "okay" if rare (add/delete).
        // BUT resetting innerHTML kills the Add buttons.
        // Strategy: Clear everything BEFORE the button row? 
        // Or assume the container ONLY has tracks, and buttons are outside?
        // Checking index.html... buttons are inside "matrixContainer" dynamically added.
        
        // Let's implement a robust "Sync" that appends missing rows.
        
        const existingRows = this.container.querySelectorAll('.sequencer-grid');
        // Remove excess
        for (let i = tracks.length; i < existingRows.length; i++) {
            existingRows[i].remove();
        }
        
        // Add missing
        for (let i = existingRows.length; i < tracks.length; i++) {
            this.appendRow(i);
        }
        
        // Re-cache references
        this.trackLabelElements = Array.from(this.container.querySelectorAll('.track-label'));
        this.stepElements = tracks.map((_, i) => {
            const row = this.trackLabelElements[i].parentElement!;
            return Array.from(row.querySelectorAll('.step-btn')) as HTMLElement[];
        });
    }

    private appendRow(trackId: number) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'sequencer-grid';
        
        // Label
        const label = document.createElement('div');
        label.className = 'track-label';
        label.dataset.track = trackId.toString();
        const displayNum = trackId + 1;
        label.innerText = displayNum < 10 ? `0${displayNum}` : displayNum.toString();
        rowDiv.appendChild(label);

        // Steps
        for(let s=0; s<NUM_STEPS; s++) {
            const btn = document.createElement('div');
            btn.className = 'step-btn';
            btn.dataset.track = trackId.toString();
            btn.dataset.step = s.toString();
            rowDiv.appendChild(btn);
        }

        // Random Button
        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.dataset.track = trackId.toString();
        rowDiv.appendChild(rndBtn);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'track-actions';
        
        const createAction = (txt: string, action: string, title: string) => {
            const b = document.createElement('button');
            b.className = 'action-btn';
            b.innerHTML = txt;
            b.title = title;
            b.dataset.track = trackId.toString();
            b.dataset.action = action;
            return b;
        };
        
        actionsDiv.appendChild(createAction('L', 'lock', 'Lock Steps'));
        actionsDiv.appendChild(createAction('M', 'mute', 'Mute'));
        actionsDiv.appendChild(createAction('S', 'solo', 'Solo'));
        actionsDiv.appendChild(createAction('X', 'ignore', 'Exclude Random'));
        actionsDiv.appendChild(createAction('C', 'clear', 'Clear')); // Using C instead of icon for consistency with logic
        
        rowDiv.appendChild(actionsDiv);

        // Visualizer Canvas (Empty placeholder, Visualizer component handles drawing)
        const visCanvas = document.createElement('canvas');
        visCanvas.className = 'track-vis-canvas';
        visCanvas.id = `vis-canvas-${trackId}`;
        visCanvas.width = 40;
        visCanvas.height = 16;
        rowDiv.appendChild(visCanvas);

        // Insert before the buttons row (last child usually)
        // We assume the last child is the button row
        const lastChild = this.container.lastElementChild;
        if (lastChild && lastChild.id === 'matrixButtonRow') {
            this.container.insertBefore(rowDiv, lastChild);
        } else {
            this.container.appendChild(rowDiv);
        }
    }
}