import { BaseComponent } from './BaseComponent.js';
import { appStore } from '../state/Store.js';
import { ACTIONS } from '../state/Actions.js';

export class ParameterKnob extends BaseComponent {
    static get observedAttributes() {
        return ['param', 'label', 'min', 'max', 'step', 'track-id'];
    }

    connectedCallback() {
        super.connectedCallback();
        this.trackId = parseInt(this.getAttribute('track-id') || appStore.state.selectedTrackId);
        this.param = this.getAttribute('param');
        
        // Listen for updates to this specific parameter on the active track
        this.subscribe(`TRACK_UPDATED:${this.trackId}`, (payload) => {
            if (payload.param === this.param) {
                this.updateValue(payload.value);
            }
        });

        // Also listen for track selection changes if track-id is not hardcoded
        if (!this.hasAttribute('track-id')) {
            this.subscribe('STATE_CHANGED:selectedTrackId', ({ value }) => {
                this.trackId = value;
                this.refresh(); // Full refresh for new track
            });
        }
    }

    get trackData() {
        return appStore.state.tracks[this.trackId];
    }

    render() {
        const label = this.getAttribute('label') || this.param;
        const min = this.getAttribute('min') || 0;
        const max = this.getAttribute('max') || 1;
        const step = this.getAttribute('step') || 0.01;
        
        const value = this.trackData ? this.trackData.params[this.param] : 0;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                label {
                    font-size: 10px;
                    color: var(--color-text-muted);
                    margin-bottom: 4px;
                    text-transform: capitalize;
                }
                input[type=range] {
                    -webkit-appearance: none;
                    width: 100%;
                    background: transparent;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    cursor: pointer;
                    margin-top: -4px;
                    box-shadow: 0 0 8px var(--color-primary-glow);
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    background: var(--color-border);
                    border-radius: 2px;
                }
                .value-display {
                    font-size: 10px;
                    color: var(--color-primary);
                    font-family: monospace;
                    margin-top: 4px;
                }
            </style>
            
            <label>${label}</label>
            <input type="range" min="${min}" max="${max}" step="${step}" value="${value}">
            <span class="value-display">${parseFloat(value).toFixed(2)}</span>
        `;

        this.input = this.shadowRoot.querySelector('input');
        this.display = this.shadowRoot.querySelector('.value-display');

        this.input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.updateDisplay(val);
            appStore.dispatch(ACTIONS.UPDATE_PARAM, {
                trackId: this.trackId,
                param: this.param,
                value: val
            });
        });
    }

    updateValue(val) {
        if (this.input) {
            this.input.value = val;
            this.updateDisplay(val);
        }
    }

    updateDisplay(val) {
        if (this.display) {
            this.display.innerText = parseFloat(val).toFixed(2);
        }
    }

    refresh() {
        if (this.trackData) {
            const val = this.trackData.params[this.param];
            this.updateValue(val);
        }
    }
}

customElements.define('parameter-knob', ParameterKnob);