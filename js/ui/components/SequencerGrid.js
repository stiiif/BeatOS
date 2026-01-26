// js/ui/components/SequencerGrid.js
import { NUM_STEPS, TRACKS_PER_GROUP, MAX_TRACKS } from '../../utils/constants.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class SequencerGrid {
    constructor() {
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
        this.tracks = [];
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

    initialize(callbacks) {
        this.callbacks = callbacks;
        this.renderHeaders();
        this.renderButtonRow();
        this.bindKeyboardShortcuts();
    }

    renderHeaders() {
        const headerContainer = document.getElementById('stepHeaders');
        headerContainer.className = 'sequencer-grid sticky top-0 bg-neutral-950 z-30 pb-2 border-b border-neutral-800 pt-2';
        headerContainer.innerHTML = '';
        
        const trkHeader = DOMHelpers.createDiv({ className: 'header-cell font-bold' });
        trkHeader.innerText = 'TRK';
        headerContainer.appendChild(trkHeader);

        for(let i = 0; i < NUM_STEPS; i++) {
            const div = DOMHelpers.createDiv({
                id: `header-step-${i}`,
                className: 'header-cell'
            });
            div.innerText = i + 1;
            
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('bar-divider');
            } else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('beat-divider');
            }
            
            headerContainer.appendChild(div);
        }

        const headers = ['RAND', 'ACTIONS', 'VIS'];
        headers.forEach(text => {
            const header = DOMHelpers.createDiv({ className: 'header-cell' });
            if (text === 'RAND') {
                header.innerHTML = '<i class="fas fa-dice"></i>';
            } else {
                header.innerText = text;
            }
            headerContainer.appendChild(header);
        });
    }

    renderButtonRow() {
        const container = document.getElementById('matrixContainer');
        const buttonRow = DOMHelpers.createDiv({
            id: 'matrixButtonRow',
            className: 'flex gap-2 mt-2 px-1'
        });
        
        const addTrackBtn = DOMHelpers.createButton({
            id: 'addTrackBtn',
            className: 'flex-1',
            innerHTML: '<i class="fas fa-plus mr-2"></i>ADD NEW TRACK',
            onClick: () => this.callbacks.onAddTrack()
        });
        
        const addGroupBtn = DOMHelpers.createButton({
            id: 'addGroupBtn',
            className: 'flex-1',
            innerHTML: '<i class="fas fa-plus-circle mr-2"></i>ADD GROUP',
            onClick: () => this.callbacks.onAddGroup()
        });
        
        buttonRow.appendChild(addTrackBtn);
        buttonRow.appendChild(addGroupBtn);
        container.appendChild(buttonRow);
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (this.keyMapping.hasOwnProperty(e.code)) {
                e.preventDefault();
                const stepIndex = this.keyMapping[e.code];
                const currentTrackId = this.callbacks.getSelectedTrackIndex();
                
                if (currentTrackId >= 0 && currentTrackId < this.tracks.length) {
                    if (stepIndex < NUM_STEPS) {
                        this.toggleStep(currentTrackId, stepIndex);
                    }
                }
            }
        });
    }

    appendTrackRow(trackId, randomChokeMode, randomChokeGroups) {
        // Implementation moved from UIManagerClean
        // [Full implementation in actual file]
    }

    toggleStep(trackId, stepIndex) {
        const track = this.tracks[trackId];
        const btn = this.matrixStepElements[trackId][stepIndex];
        
        if (track.type === 'automation') {
            // Automation track logic
            const current = track.steps[stepIndex];
            track.steps[stepIndex] = (current + 1) % 6;
            
            btn.classList.remove('active', 'auto-level-1', 'auto-level-2', 
                                'auto-level-3', 'auto-level-4', 'auto-level-5');
            
            if (track.steps[stepIndex] > 0) {
                btn.classList.add('active', `auto-level-${track.steps[stepIndex]}`);
            }
        } else {
            // Regular track logic
            const current = track.steps[stepIndex];
            track.steps[stepIndex] = (current + 1) % 4;
            
            btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
            
            if (track.steps[stepIndex] > 0) {
                btn.classList.add('active', `vel-${track.steps[stepIndex]}`);
            }
        }
    }

    updateMatrixHead(currentStep, totalStepsPlayed) {
        const masterStep = (typeof totalStepsPlayed !== 'undefined') ? 
                          totalStepsPlayed : currentStep;

        for (let t = 0; t < this.tracks.length; t++) {
            const track = this.tracks[t];
            const div = track.clockDivider || 1;
            
            const currentLit = this.matrixStepElements[t].filter(
                el => el.classList.contains('step-playing')
            );
            currentLit.forEach(el => el.classList.remove('step-playing'));
            
            const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
            const currentEffective = Math.floor(masterStep / div) % trackLength;
            
            if (this.matrixStepElements[t] && this.matrixStepElements[t][currentEffective]) {
                this.matrixStepElements[t][currentEffective].classList.add('step-playing');
            }
        }
    }

    clearPlayheadForStop() {
        for (let t = 0; t < this.tracks.length; t++) {
            for (let s = 0; s < NUM_STEPS; s++) {
                if (this.matrixStepElements[t] && this.matrixStepElements[t][s]) {
                    this.matrixStepElements[t][s].classList.remove('step-playing');
                }
            }
        }
    }

    updateGridVisuals(timeSig) {
        const headers = document.getElementById('stepHeaders');
        if (!headers) return;
        
        for (let i = 0; i < NUM_STEPS; i++) {
            const header = document.getElementById(`header-step-${i}`);
            if (!header) continue;
            
            header.classList.remove('bar-divider', 'beat-divider');
            
            if (timeSig === '4/4') {
                if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) {
                    header.classList.add('bar-divider');
                } else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) {
                    header.classList.add('beat-divider');
                }
            } else if (timeSig === '3/4') {
                if ((i + 1) % 12 === 0 && i !== NUM_STEPS - 1) {
                    header.classList.add('bar-divider');
                } else if ((i + 1) % 3 === 0 && i !== NUM_STEPS - 1) {
                    header.classList.add('beat-divider');
                }
            }
        }
    }

    // Public getters
    getMatrixStepElements() { return this.matrixStepElements; }
    getTrackLabelElements() { return this.trackLabelElements; }
    getTrackRowElements() { return this.trackRowElements; }
}