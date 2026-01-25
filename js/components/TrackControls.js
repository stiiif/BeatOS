import { BaseComponent } from './BaseComponent.js';
import { appStore } from '../state/Store.js';
import './ParameterKnob.js'; // Ensure dependency is loaded

export class TrackControls extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        
        // Re-render when selected track changes
        this.subscribe('STATE_CHANGED:selectedTrackId', () => {
            this.render();
        });
        
        // Also re-render if the type of the selected track changes (e.g. synth -> drum)
        // We need to listen to the specific track's update or generic state change
        // For simplicity, we just check active track.
    }

    get activeTrackId() {
        return appStore.state.selectedTrackId;
    }

    get activeTrack() {
        return appStore.state.tracks[this.activeTrackId];
    }

    render() {
        if (!this.activeTrack) return;

        const type = this.activeTrack.type;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 1rem;
                    background: var(--color-bg-panel);
                    color: var(--color-text-main);
                    height: 100%;
                    overflow-y: auto;
                }
                h3 {
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 0.5rem;
                }
                .controls-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .full-width {
                    grid-column: span 2;
                }
            </style>

            <div class="inspector-header">
                <h3>${type.toUpperCase()} Engine (Track ${this.activeTrackId + 1})</h3>
            </div>

            ${this.renderEngineControls(type)}

            <!-- Global Bus Controls (Always Visible) -->
            <h3>Mixer & Filter</h3>
            <div class="controls-grid">
                <parameter-knob param="volume" label="Volume" max="1.5"></parameter-knob>
                <parameter-knob param="pan" label="Pan" min="-1" max="1"></parameter-knob>
                <parameter-knob param="hpFilter" label="High Pass" min="20" max="5000" step="10"></parameter-knob>
                <parameter-knob param="filter" label="Low Pass" min="100" max="20000" step="100"></parameter-knob>
            </div>
        `;
    }

    renderEngineControls(type) {
        if (type === 'granular') {
            return `
                <div class="controls-grid">
                    <parameter-knob param="position" label="Position" class="full-width"></parameter-knob>
                    <parameter-knob param="spray" label="Spray" max="0.5"></parameter-knob>
                    <parameter-knob param="scanSpeed" label="Scan Speed" min="-2" max="2"></parameter-knob>
                    <parameter-knob param="grainSize" label="Grain Size" min="0.01" max="0.5"></parameter-knob>
                    <parameter-knob param="density" label="Density" min="1" max="50" step="1"></parameter-knob>
                    <parameter-knob param="pitch" label="Pitch" min="0.1" max="4.0"></parameter-knob>
                    <parameter-knob param="overlap" label="Overlap" max="8"></parameter-knob>
                </div>
                <h3>Amp Envelope</h3>
                <div class="controls-grid">
                    <parameter-knob param="ampAttack" label="Attack" max="1"></parameter-knob>
                    <parameter-knob param="ampDecay" label="Decay" max="1"></parameter-knob>
                    <parameter-knob param="ampRelease" label="Release" max="2"></parameter-knob>
                </div>
            `;
        } else if (type === 'simple-drum') {
            return `
                <div class="controls-grid">
                    <parameter-knob param="drumTune" label="Tuning"></parameter-knob>
                    <parameter-knob param="drumDecay" label="Decay"></parameter-knob>
                </div>
            `;
        }
        return `<div>No controls for this type</div>`;
    }
}

customElements.define('track-controls', TrackControls);