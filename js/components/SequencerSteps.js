import { BaseComponent } from './BaseComponent.js';
import { appStore } from '../state/Store.js';
import { ACTIONS } from '../state/Actions.js';
import { NUM_STEPS, TRACKS_PER_GROUP } from '../utils/constants.js';

export class SequencerSteps extends BaseComponent {
    static get observedAttributes() {
        return ['track-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'track-id' && oldValue !== newValue) {
            this.trackId = parseInt(newValue);
            this.render();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Listen for step updates for this track
        this.subscribe(`TRACK_UPDATED:${this.trackId}`, (payload) => {
            if (payload.stepIndex !== undefined) {
                this.updateStep(payload.stepIndex, payload.value);
            }
        });

        // Listen for global playback step to update playhead
        this.subscribe('STATE_CHANGED:currentStep', ({ value }) => {
            this.updatePlayhead(value);
        });
    }

    get trackData() {
        return appStore.state.tracks[this.trackId];
    }

    render() {
        if (this.trackId === undefined || !this.trackData) return;

        const groupIdx = Math.floor(this.trackId / TRACKS_PER_GROUP);
        const hue = groupIdx * 45;
        const groupColor = `hsl(${hue}, 70%, 50%)`;
        const groupColorGlow = `hsla(${hue}, 70%, 50%, 0.4)`;

        // Construct grid style
        let stepsHtml = '';
        for (let i = 0; i < NUM_STEPS; i++) {
            const val = this.trackData.steps[i];
            
            // Logic for dividers
            let extraClass = '';
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) extraClass += ' bar-divider';
            else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) extraClass += ' beat-divider';

            // Logic for velocity/active state
            let activeClass = '';
            if (val > 0) activeClass = `vel-${val}`;

            stepsHtml += `<div class="step-btn ${extraClass} ${activeClass}" data-step="${i}"></div>`;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: contents; /* Integrate into parent grid */
                }
                .step-btn {
                    height: var(--step-height);
                    background: #171717;
                    border: 1px solid #222;
                    border-radius: 1px;
                    cursor: pointer;
                    box-sizing: border-box;
                }
                .step-btn:hover { border-color: #444; }

                /* Velocity Colors */
                .vel-1 { 
                    background: ${groupColor}; opacity: 0.35; transform: scale(0.8); 
                }
                .vel-2 { 
                    background: ${groupColor}; opacity: 0.75; 
                    box-shadow: 0 0 2px ${groupColorGlow};
                }
                .vel-3 { 
                    background: ${groupColor}; opacity: 1.0; border-color: #fff;
                    box-shadow: 0 0 6px ${groupColorGlow};
                }

                /* Playhead */
                .step-playing {
                    background-color: #333 !important;
                    border-color: #666 !important;
                }
                .vel-1.step-playing, .vel-2.step-playing, .vel-3.step-playing {
                    filter: brightness(1.3);
                    border-color: #fff !important;
                }

                /* Dividers */
                .beat-divider { border-right: 1px solid #444 !important; margin-right: 1px; }
                .bar-divider { border-right: 2px solid #737373 !important; margin-right: 1px; }
            </style>
            ${stepsHtml}
        `;

        // Event Delegation
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.classList.contains('step-btn')) {
                const stepIndex = parseInt(e.target.dataset.step);
                appStore.dispatch(ACTIONS.TOGGLE_STEP, { trackId: this.trackId, stepIndex });
            }
        });
        
        this.stepElements = this.shadowRoot.querySelectorAll('.step-btn');
    }

    updateStep(index, value) {
        const btn = this.stepElements[index];
        if (!btn) return;

        btn.classList.remove('vel-1', 'vel-2', 'vel-3');
        if (value > 0) {
            btn.classList.add(`vel-${value}`);
        }
    }

    updatePlayhead(currentStep) {
        // Simple optimization: remove from all, add to current
        // For 32 steps, iterating is fast enough.
        this.stepElements.forEach((el, idx) => {
            if (idx === currentStep) el.classList.add('step-playing');
            else el.classList.remove('step-playing');
        });
    }
}

customElements.define('sequencer-steps', SequencerSteps);