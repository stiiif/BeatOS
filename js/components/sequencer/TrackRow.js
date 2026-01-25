import { BaseComponent } from '../BaseComponent.js';
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../config/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../config/events.js';

export class TrackRow extends BaseComponent {
    constructor(track, trackIndex, manager) {
        super();
        this.track = track;
        this.index = trackIndex;
        this.manager = manager; // Reference to Sequencer or TrackManager for complex actions
        this.stepElements = [];
        this.element = this.render();
    }

    render() {
        const groupIdx = Math.floor(this.index / TRACKS_PER_GROUP);
        // Default color, can be overridden by dynamic group logic later
        const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${groupIdx * 45}, 70%, 50%, 0.4)`;

        const row = this.createElement('div', 'sequencer-grid');
        this.element = row; // Set for base component usage

        // 1. Label
        const label = this.createElement('div', 'track-label', 
            (this.index + 1).toString().padStart(2, '0'), 
            { onclick: () => this.selectTrack() }
        );
        label.style.borderRight = `3px solid ${groupColor}`;
        if (this.index === 0) label.classList.add('selected'); // Initial state
        this.labelElement = label;
        row.appendChild(label);

        // 2. Steps
        for (let i = 0; i < NUM_STEPS; i++) {
            const btn = this.createElement('div', 'step-btn');
            
            // Add grid dividers
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) btn.classList.add('bar-divider');
            else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) btn.classList.add('beat-divider');

            // Apply CSS Variables for color
            btn.style.setProperty('--step-group-color', groupColor);
            btn.style.setProperty('--step-group-color-glow', groupColorGlow);

            // Bind click
            btn.onclick = () => this.toggleStep(i);

            // Initial State
            this.updateStepVisual(btn, i);

            this.stepElements.push(btn);
            row.appendChild(btn);
        }

        // 3. Random Button
        const rndBtn = this.createElement('div', 'track-rnd-btn', '<i class="fas fa-random"></i>', {
            onclick: () => this.randomizePattern()
        });
        row.appendChild(rndBtn);

        // 4. Actions
        const actionsDiv = this.createElement('div', 'track-actions');
        
        // Helper for action buttons
        const createAction = (text, title, onClick, cls = '') => {
            const b = this.createElement('button', `action-btn ${cls}`, text, { title, onclick: (e) => { e.stopPropagation(); onClick(); }});
            return b;
        };

        this.btnMute = createAction('M', 'Mute', () => this.toggleMute());
        this.btnSolo = createAction('S', 'Solo', () => this.toggleSolo());
        this.btnLock = createAction('L', 'Lock Steps', () => this.toggleLock());
        
        // Group Actions (delegated to bus/manager)
        const btnMuteG = createAction('Mg', 'Mute Group', () => globalBus.emit('GROUP_ACTION', { type: 'MUTE', group: groupIdx }));
        const btnSoloG = createAction('Sg', 'Solo Group', () => globalBus.emit('GROUP_ACTION', { type: 'SOLO', group: groupIdx }));
        const btnClear = createAction('C', 'Clear Track', () => this.clearPattern(), 'erase');
        const btnClearG = createAction('Cg', 'Clear Group', () => globalBus.emit('GROUP_ACTION', { type: 'CLEAR', group: groupIdx }), 'erase');
        
        this.btnIgnore = createAction('X', 'Exclude Random', () => this.toggleIgnore());

        actionsDiv.append(this.btnLock, this.btnMute, btnMuteG, this.btnSolo, btnSoloG, btnClear, btnClearG, this.btnIgnore);
        this.updateActionVisuals();
        row.appendChild(actionsDiv);

        // 5. Visualizer Canvas
        const canvas = this.createElement('canvas', 'track-vis-canvas', '', {
            width: 40, height: 16, id: `vis-canvas-${this.index}`, onclick: () => this.selectTrack()
        });
        row.appendChild(canvas);

        return row;
    }

    // --- Actions ---

    selectTrack() {
        globalBus.emit(EVENTS.TRACK_SELECTED, this.index);
        // Visual selection update is handled by the parent/listener to ensure exclusivity
    }

    toggleStep(stepIndex) {
        if (this.track.type === 'automation') {
            let val = this.track.steps[stepIndex];
            val = (val + 1) % 6;
            this.track.steps[stepIndex] = val;
        } else {
            // V2 Velocity Logic
            let val = this.track.steps[stepIndex];
            let nextVal = 0;
            if (val === 0) nextVal = 2; // Normal
            else if (val === 2) nextVal = 3; // Accent
            else if (val === 3) nextVal = 1; // Ghost
            else if (val === 1) nextVal = 0; // Off
            this.track.steps[stepIndex] = nextVal;
        }
        this.updateStepVisual(this.stepElements[stepIndex], stepIndex);
    }

    toggleMute() {
        this.track.muted = !this.track.muted;
        this.updateActionVisuals();
        this.updateOpacity();
    }

    toggleSolo() {
        this.track.soloed = !this.track.soloed;
        this.updateActionVisuals();
    }

    toggleLock() {
        this.track.stepLock = !this.track.stepLock;
        this.updateActionVisuals();
    }

    toggleIgnore() {
        this.track.ignoreRandom = !this.track.ignoreRandom;
        this.updateActionVisuals();
    }

    clearPattern() {
        this.track.steps.fill(0);
        this.stepElements.forEach((el, i) => this.updateStepVisual(el, i));
    }

    randomizePattern() {
        if (this.track.type === 'automation') return; // TODO: Auto logic
        
        for(let i=0; i<NUM_STEPS; i++) {
            if (this.track.stepLock) continue;
            if (Math.random() < 0.25) {
                const rnd = Math.random();
                let vel = 2; 
                if (rnd > 0.8) vel = 3; 
                else if (rnd < 0.2) vel = 1;
                this.track.steps[i] = vel;
            } else {
                this.track.steps[i] = 0;
            }
            this.updateStepVisual(this.stepElements[i], i);
        }
    }

    // --- Visual Updates ---

    updateStepVisual(el, index) {
        const val = this.track.steps[index];
        el.className = 'step-btn'; // Reset
        
        // Re-add dividers
        if ((index + 1) % 16 === 0 && index !== NUM_STEPS - 1) el.classList.add('bar-divider');
        else if ((index + 1) % 4 === 0 && index !== NUM_STEPS - 1) el.classList.add('beat-divider');

        if (val > 0) {
            if (this.track.type === 'automation') {
                el.classList.add('active', `auto-level-${val}`);
            } else {
                el.classList.add(`vel-${val}`);
            }
        }
    }

    updateActionVisuals() {
        const t = this.track;
        if(t.muted) this.btnMute.classList.add('mute-active'); else this.btnMute.classList.remove('mute-active');
        if(t.soloed) this.btnSolo.classList.add('solo-active'); else this.btnSolo.classList.remove('solo-active');
        if(t.stepLock) this.btnLock.classList.add('lock-active'); else this.btnLock.classList.remove('lock-active');
        if(t.ignoreRandom) this.btnIgnore.classList.add('exclude-active'); else this.btnIgnore.classList.remove('exclude-active');
    }

    updateOpacity() {
        this.element.style.opacity = this.track.muted ? '0.4' : '1.0';
    }

    setSelected(isSelected) {
        if (isSelected) this.labelElement.classList.add('selected');
        else this.labelElement.classList.remove('selected');
    }
}