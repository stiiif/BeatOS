import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import { store } from '../state/Store';
import { AppState, TrackState } from '../types/state';
import { ActionTypes } from '../state/actions';
import { InstrumentType, TrackParams } from '../types/audio';
import { NUM_LFOS } from '../config/constants';

export class Inspector extends Component {
    // Header
    private trackNum: HTMLElement;
    private indicator: HTMLElement;
    private typeLabel: HTMLElement;
    private groupLabel: HTMLElement;

    // Containers
    private granularControls: HTMLElement;
    private drumControls: HTMLElement;
    private autoControls: HTMLElement;
    private lfoSection: HTMLElement;
    
    // LFO
    private lfoTabsContainer: HTMLElement;
    private lfoTarget: HTMLSelectElement;
    private lfoWave: HTMLSelectElement;
    private lfoRate: HTMLInputElement;
    private lfoRateVal: HTMLElement;
    private lfoAmt: HTMLInputElement;
    private lfoAmtVal: HTMLElement;

    constructor() {
        super();
        // Bind Elements
        this.trackNum = document.getElementById(DOM_IDS.TRACK_HEADER.NUM)!;
        this.indicator = document.getElementById(DOM_IDS.TRACK_HEADER.INDICATOR)!;
        this.typeLabel = document.getElementById(DOM_IDS.TRACK_HEADER.LABEL)!;
        this.groupLabel = document.getElementById(DOM_IDS.TRACK_HEADER.GROUP)!;

        this.granularControls = document.getElementById(DOM_IDS.CONTROLS.GRANULAR_CONTAINER)!;
        this.drumControls = document.getElementById(DOM_IDS.CONTROLS.DRUM_CONTAINER)!;
        this.autoControls = document.getElementById(DOM_IDS.CONTROLS.AUTO_CONTAINER)!;
        this.lfoSection = document.getElementById(DOM_IDS.CONTROLS.LFO_CONTAINER)!;

        this.lfoTabsContainer = document.getElementById('lfoTabsContainer')!;
        this.lfoTarget = document.getElementById('lfoTarget') as HTMLSelectElement;
        this.lfoWave = document.getElementById('lfoWave') as HTMLSelectElement;
        this.lfoRate = document.getElementById('lfoRate') as HTMLInputElement;
        this.lfoRateVal = document.getElementById('lfoRateVal')!;
        this.lfoAmt = document.getElementById('lfoAmt') as HTMLInputElement;
        this.lfoAmtVal = document.getElementById('lfoAmtVal')!;

        this.bindEvents();
    }

    private bindEvents() {
        // 1. Sliders (Event Delegation for all params)
        // We bind to the right pane container to catch all sliders
        const rightPane = document.querySelector('.right-pane');
        if (rightPane) {
            rightPane.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.classList.contains('param-slider')) {
                    const param = target.dataset.param as keyof TrackParams;
                    const value = parseFloat(target.value);
                    
                    store.dispatch({
                        type: ActionTypes.UPDATE_TRACK_PARAM,
                        payload: {
                            trackId: store.getState().ui.selectedTrackId,
                            param,
                            value
                        }
                    });
                    
                    // Update Label locally for speed
                    if (target.nextElementSibling) {
                        // Minimal formatting logic here or call a helper
                        target.nextElementSibling.textContent = value.toFixed(2);
                    }
                }
            });
        }

        // 2. LFO Controls
        this.lfoTarget.addEventListener('change', () => this.updateLFO('target', this.lfoTarget.value));
        this.lfoWave.addEventListener('change', () => this.updateLFO('wave', this.lfoWave.value));
        
        this.lfoRate.addEventListener('input', () => {
            const val = parseFloat(this.lfoRate.value);
            this.lfoRateVal.innerText = val.toFixed(1);
            this.updateLFO('rate', val);
        });
        
        this.lfoAmt.addEventListener('input', () => {
            const val = parseFloat(this.lfoAmt.value);
            this.lfoAmtVal.innerText = val.toFixed(2);
            this.updateLFO('amount', val);
        });

        // 3. LFO Tabs
        this.lfoTabsContainer.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.lfo-tab') as HTMLElement;
            if (btn) {
                const index = parseInt(btn.dataset.lfo!);
                store.dispatch({ type: ActionTypes.SELECT_LFO, payload: index });
            }
        });
        
        // 4. Reset & Randomize Buttons
        document.getElementById('resetParamBtn')?.addEventListener('click', () => {
             // Logic to reset params would be an action dispatch
             // For now, simpler: Set Track Type again which resets defaults
             const track = this.getSelectedTrack();
             if(track) {
                 store.dispatch({
                     type: ActionTypes.SET_TRACK_TYPE,
                     payload: { trackId: track.id, type: track.type, defaults: {} } 
                 });
             }
        });
        
        // 5. Type Selectors (Kick, Snare, etc) - bind via delegation or specific IDs if needed
        document.querySelectorAll('.sound-gen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = (e.target as HTMLElement).dataset.type; // kick, snare, etc.
                // In new architecture, we dispatch LOAD_PRESET or similar.
                // For simplicity, we can reuse logic or call a service.
                // Let's assume we dispatch SET_TRACK_TYPE with specific defaults
                // OR we can trigger the "Heuristic" logic via an action.
            });
        });
    }

    private updateLFO(key: string, value: any) {
        const state = store.getState();
        store.dispatch({
            type: ActionTypes.UPDATE_LFO,
            payload: {
                trackId: state.ui.selectedTrackId,
                lfoIndex: state.ui.selectedLfoIndex,
                lfoData: { [key]: value }
            }
        });
    }

    private getSelectedTrack(): TrackState | undefined {
        const state = store.getState();
        return state.tracks[state.ui.selectedTrackId];
    }

    render(state: AppState) {
        const track = state.tracks[state.ui.selectedTrackId];
        if (!track) return;

        // 1. Header
        const displayNum = track.id + 1;
        this.trackNum.innerText = displayNum < 10 ? `0${displayNum}` : displayNum.toString();
        
        // Group Color
        const groupIdx = Math.floor(track.id / 8); // hardcoded constant usage
        const groupColor = `hsl(${groupIdx * 45}, 70%, 50%)`;
        this.indicator.style.backgroundColor = groupColor;
        this.groupLabel.innerText = `GRP ${groupIdx}`;
        this.groupLabel.style.color = groupColor;
        
        let typeName = 'Synth';
        if (track.sample) typeName = 'Sample';
        else if (track.type === 'simple-drum') typeName = track.params.drumType.toUpperCase();
        else if (track.type === 'automation') typeName = 'Auto';
        this.typeLabel.innerText = `[${typeName}]`;

        // 2. Visibility
        this.granularControls.classList.add('hidden');
        this.drumControls.classList.add('hidden');
        this.autoControls.classList.add('hidden');
        this.lfoSection.classList.add('hidden');

        if (track.type === 'automation') {
            this.autoControls.classList.remove('hidden');
        } else if (track.type === 'simple-drum') {
            this.drumControls.classList.remove('hidden');
        } else {
            this.granularControls.classList.remove('hidden');
            this.lfoSection.classList.remove('hidden');
        }

        // 3. Update Sliders (Only if they aren't being dragged to avoid fighting user)
        // Simple check: activeElement
        const activeEl = document.activeElement;
        
        const updateInput = (id: string, val: number) => {
            const input = document.querySelector(`input[data-param="${id}"]`) as HTMLInputElement;
            if (input && input !== activeEl) {
                input.value = val.toString();
                if(input.nextElementSibling) input.nextElementSibling.textContent = val.toFixed(2);
            }
        };

        // Bulk update common params
        if (track.type === 'granular') {
            updateInput('position', track.params.position);
            updateInput('spray', track.params.spray);
            updateInput('density', track.params.density);
            updateInput('grainSize', track.params.grainSize);
            updateInput('pitch', track.params.pitch);
            // ... map others
        } else if (track.type === 'simple-drum') {
            updateInput('drumTune', track.params.drumTune);
            updateInput('drumDecay', track.params.drumDecay);
        }
        
        // Global params
        updateInput('hpFilter', track.params.hpFilter);
        updateInput('filter', track.params.filter);
        updateInput('volume', track.params.volume);

        // 4. LFO UI
        this.renderLFOs(track, state.ui.selectedLfoIndex);
    }

    private renderLFOs(track: TrackState, selectedIndex: number) {
        // Regenerate Tabs if needed (simple check)
        if (this.lfoTabsContainer.children.length === 0) {
            for(let i=0; i<NUM_LFOS; i++) {
                const btn = document.createElement('button');
                btn.className = 'lfo-tab text-[10px] font-bold py-1 rounded transition min-w-[40px]';
                btn.dataset.lfo = i.toString();
                btn.innerText = `LFO ${i+1}`;
                this.lfoTabsContainer.appendChild(btn);
            }
        }

        // Highlight Tab
        const tabs = this.lfoTabsContainer.children;
        for(let i=0; i<tabs.length; i++) {
            const btn = tabs[i] as HTMLElement;
            if (i === selectedIndex) {
                btn.classList.add('text-white', 'bg-neutral-600');
                btn.classList.remove('text-neutral-400');
            } else {
                btn.classList.remove('text-white', 'bg-neutral-600');
                btn.classList.add('text-neutral-400');
            }
        }

        // Values
        const lfo = track.lfos[selectedIndex];
        if (document.activeElement !== this.lfoTarget) this.lfoTarget.value = lfo.target;
        if (document.activeElement !== this.lfoWave) this.lfoWave.value = lfo.wave;
        if (document.activeElement !== this.lfoRate) {
            this.lfoRate.value = lfo.rate.toString();
            this.lfoRateVal.innerText = lfo.rate.toFixed(1);
        }
        if (document.activeElement !== this.lfoAmt) {
            this.lfoAmt.value = lfo.amount.toString();
            this.lfoAmtVal.innerText = lfo.amount.toFixed(2);
        }
    }
}