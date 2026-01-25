import { BaseComponent } from './BaseComponent.js';
import { appStore } from '../state/Store.js';
import { ACTIONS } from '../state/Actions.js';
import { TRACKS_PER_GROUP } from '../utils/constants.js';

export class TrackRow extends BaseComponent {
    static get observedAttributes() {
        return ['track-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'track-id' && oldValue !== newValue) {
            this.trackId = parseInt(newValue);
            this.render(); // Re-render if ID changes (rare)
        }
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Subscribe to specific track updates to avoid re-rendering unrelated rows
        this.subscribe(`TRACK_UPDATED:${this.trackId}`, (payload) => {
            this.updateState(payload);
        });

        // Also subscribe to selection changes to highlight selected track
        this.subscribe('STATE_CHANGED:selectedTrackId', ({ value }) => {
            this.updateSelection(value);
        });
    }

    get trackData() {
        return appStore.state.tracks[this.trackId];
    }

    render() {
        if (this.trackId === undefined || !this.trackData) return;

        const t = this.trackData;
        const groupIdx = Math.floor(this.trackId / TRACKS_PER_GROUP);
        // Calculate group color (simple HSL rotation)
        const hue = groupIdx * 45;
        const groupColor = `hsl(${hue}, 70%, 50%)`;

        const displayNum = this.trackId + 1;
        const numStr = displayNum < 10 ? `0${displayNum}` : displayNum;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: contents; /* Allows grid layout from parent to apply */
                }
                .track-label {
                    font-size: 0.6rem;
                    height: var(--step-height);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-bg-panel);
                    color: var(--color-text-muted);
                    cursor: pointer;
                    border-radius: 1px;
                    border-right: 3px solid ${groupColor};
                    transition: all 0.2s;
                    user-select: none;
                }
                .track-label:hover { background: var(--color-bg-element); color: var(--color-text-main); }
                .track-label.selected {
                    background: #064e3b; /* Dark emerald */
                    color: var(--color-primary);
                    border-left: 2px solid var(--color-primary);
                }
                
                .track-actions {
                    height: var(--step-height);
                    display: flex;
                    gap: 1px;
                    background: #000;
                }
                .action-btn {
                    flex: 1;
                    font-size: 0.45rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1a1a1a;
                    color: #555;
                    cursor: pointer;
                    border: none;
                    padding: 0;
                    transition: all 0.1s;
                    min-width: 0;
                }
                .action-btn:hover { color: #fff; background: #333; }
                
                .mute-active { color: var(--color-accent-4); background: #450a0a; }
                .solo-active { color: var(--color-accent-6); background: #422006; }
            </style>

            <!-- Track Label -->
            <div class="track-label ${appStore.state.selectedTrackId === this.trackId ? 'selected' : ''}" id="label">
                ${numStr}
            </div>

            <!-- Steps (Placeholder for Slot or sibling component) -->
            <slot name="steps"></slot>

            <!-- Random Button (Placeholder) -->
            <div style="background: #171717; width: 25px;"></div>

            <!-- Actions -->
            <div class="track-actions">
                <button class="action-btn ${t.muted ? 'mute-active' : ''}" id="btnM">M</button>
                <button class="action-btn ${t.soloed ? 'solo-active' : ''}" id="btnS">S</button>
                <button class="action-btn" id="btnC">C</button>
            </div>

            <!-- Visualizer (Placeholder) -->
            <div style="background: #000; width: 30px; border-left: 1px solid #222;"></div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const label = this.shadowRoot.getElementById('label');
        const btnM = this.shadowRoot.getElementById('btnM');
        const btnS = this.shadowRoot.getElementById('btnS');
        
        label.addEventListener('click', () => {
            appStore.dispatch(ACTIONS.SELECT_TRACK, { trackId: this.trackId });
        });

        btnM.addEventListener('click', (e) => {
            e.stopPropagation();
            appStore.dispatch(ACTIONS.TOGGLE_MUTE, { trackId: this.trackId });
        });

        btnS.addEventListener('click', (e) => {
            e.stopPropagation();
            appStore.dispatch(ACTIONS.TOGGLE_SOLO, { trackId: this.trackId });
        });
    }

    updateState({ key, value }) {
        if (key === 'muted') {
            const btn = this.shadowRoot.getElementById('btnM');
            if (value) btn.classList.add('mute-active');
            else btn.classList.remove('mute-active');
        } else if (key === 'soloed') {
            const btn = this.shadowRoot.getElementById('btnS');
            if (value) btn.classList.add('solo-active');
            else btn.classList.remove('solo-active');
        }
    }

    updateSelection(selectedId) {
        const label = this.shadowRoot.getElementById('label');
        if (selectedId === this.trackId) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    }
}

customElements.define('track-row', TrackRow);