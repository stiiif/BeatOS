import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import { store } from '../state/Store';
import type { AppState } from '../types/state';
import { ActionTypes } from '../state/actions';
import { NUM_STEPS, TRACKS_PER_GROUP } from '../config/constants';

export class Grid extends Component {
    private container: HTMLElement;
    private headerContainer: HTMLElement;
    private trackLabelElements: HTMLElement[] = [];
    private stepElements: HTMLElement[][] = []; 
    private keyMapping: Record<string, number>;

    constructor() {
        super();
        this.container = document.getElementById(DOM_IDS.GRID.CONTAINER)!;
        this.headerContainer = document.getElementById(DOM_IDS.GRID.HEADERS)!;
        
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
        this.headerContainer.innerHTML = '';
        
        const trkHeader = document.createElement('div');
        trkHeader.className = 'header-cell font-bold';
        trkHeader.innerText = 'TRK';
        this.headerContainer.appendChild(trkHeader);

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

        const headers = ['<i class="fas fa-dice"></i>', 'ACTIONS', 'VIS'];
        headers.forEach(h => {
            const div = document.createElement('div');
            div.className = 'header-cell';
            div.innerHTML = h;
            this.headerContainer.appendChild(div);
        });
    }

    private bindEvents() {
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
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

            const label = target.closest('.track-label') as HTMLElement;
            if (label && label.dataset.track) {
                const trackId = parseInt(label.dataset.track);
                store.dispatch({ type: ActionTypes.SELECT_TRACK, payload: trackId });
                return;
            }

            const actionBtn = target.closest('.action-btn') as HTMLElement;
            if (actionBtn && actionBtn.dataset.action && actionBtn.dataset.track) {
                const trackId = parseInt(actionBtn.dataset.track);
                const action = actionBtn.dataset.action;
                
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
            
            const rndBtn = target.closest('.track-rnd-btn') as HTMLElement;
            if (rndBtn && rndBtn.dataset.track) {
                const trackId = parseInt(rndBtn.dataset.track);
                this.randomizeTrack(trackId);
            }
        });

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
        
        steps.forEach((val, stepId) => {
             store.dispatch({
                 type: ActionTypes.SET_STEP_VALUE,
                 payload: { trackId, stepId, value: val }
             });
        });
    }

    render(state: AppState) {
        if (this.trackLabelElements.length !== state.tracks.length) {
            this.rebuildGrid(state.tracks);
        }

        state.tracks.forEach((track, tIdx) => {
            const isSelected = tIdx === state.ui.selectedTrackId;
            const label = this.trackLabelElements[tIdx];
            if (label) {
                if (isSelected) label.classList.add('selected');
                else label.classList.remove('selected');
                
                const groupIdx = Math.floor(tIdx / TRACKS_PER_GROUP);
                const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
                label.style.borderRight = `3px solid ${groupColor}`;
            }

            const trackSteps = this.stepElements[tIdx];
            if (trackSteps) {
                trackSteps.forEach((el, sIdx) => {
                    el.className = 'step-btn';
                    
                    if ((sIdx + 1) % 16 === 0 && sIdx !== NUM_STEPS - 1) el.classList.add('bar-divider');
                    else if ((sIdx + 1) % 4 === 0 && sIdx !== NUM_STEPS - 1) el.classList.add('beat-divider');

                    if (sIdx === state.transport.currentStep) {
                        el.classList.add('step-playing');
                    }

                    const val = track.steps[sIdx];
                    if (val > 0) {
                        if (track.type === 'automation') {
                            el.classList.add('active', `auto-level-${val}`);
                        } else {
                            el.classList.add(`vel-${val}`);
                        }
                    }
                    
                    const groupIdx = Math.floor(tIdx / TRACKS_PER_GROUP);
                    const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
                    el.style.setProperty('--step-group-color', groupColor);
                });
            }
            
            const row = this.trackLabelElements[tIdx]?.parentElement;
            if (row) {
                const btnM = row.querySelector(`[data-action="mute"]`);
                const btnS = row.querySelector(`[data-action="solo"]`);
                const btnL = row.querySelector(`[data-action="lock"]`);
                
                if (track.triggers.muted) btnM?.classList.add('mute-active'); else btnM?.classList.remove('mute-active');
                if (track.triggers.soloed) btnS?.classList.add('solo-active'); else btnS?.classList.remove('solo-active');
                if (track.triggers.locked) btnL?.classList.add('lock-active'); else btnL?.classList.remove('lock-active');
                
                if (track.triggers.muted) row.classList.add('row-muted'); else row.classList.remove('row-muted');
            }
        });
        
        for(let i=0; i<NUM_STEPS; i++) {
            const h = document.getElementById(`header-step-${i}`);
            if(h) {
                if (i === state.transport.currentStep) h.classList.add('text-emerald-400');
                else h.classList.remove('text-emerald-400');
            }
        }
    }

    private rebuildGrid(tracks: AppState['tracks']) {
        const existingRows = this.container.querySelectorAll('.sequencer-grid');
        for (let i = tracks.length; i < existingRows.length; i++) {
            existingRows[i].remove();
        }
        
        for (let i = existingRows.length; i < tracks.length; i++) {
            this.appendRow(i);
        }
        
        this.trackLabelElements = Array.from(this.container.querySelectorAll('.track-label'));
        this.stepElements = tracks.map((_, i) => {
            const row = this.trackLabelElements[i].parentElement!;
            return Array.from(row.querySelectorAll('.step-btn')) as HTMLElement[];
        });
    }

    private appendRow(trackId: number) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'sequencer-grid';
        
        const label = document.createElement('div');
        label.className = 'track-label';
        label.dataset.track = trackId.toString();
        const displayNum = trackId + 1;
        label.innerText = displayNum < 10 ? `0${displayNum}` : displayNum.toString();
        rowDiv.appendChild(label);

        for(let s=0; s<NUM_STEPS; s++) {
            const btn = document.createElement('div');
            btn.className = 'step-btn';
            btn.dataset.track = trackId.toString();
            btn.dataset.step = s.toString();
            rowDiv.appendChild(btn);
        }

        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.dataset.track = trackId.toString();
        rowDiv.appendChild(rndBtn);

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
        actionsDiv.appendChild(createAction('C', 'clear', 'Clear'));
        
        rowDiv.appendChild(actionsDiv);

        const visCanvas = document.createElement('canvas');
        visCanvas.className = 'track-vis-canvas';
        visCanvas.id = `vis-canvas-${trackId}`;
        visCanvas.width = 40;
        visCanvas.height = 16;
        rowDiv.appendChild(visCanvas);

        const lastChild = this.container.lastElementChild;
        if (lastChild && lastChild.id === 'matrixButtonRow') {
            this.container.insertBefore(rowDiv, lastChild);
        } else {
            this.container.appendChild(rowDiv);
        }
    }
}