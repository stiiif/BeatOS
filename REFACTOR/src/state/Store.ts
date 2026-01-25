import { AppState, TrackState } from '../types/state';
import { START_TRACKS, NUM_LFOS, NUM_STEPS } from '../config/constants';
import { DEFAULT_GRANULAR_PARAMS } from '../config/mappings';

type Listener = (state: AppState) => void;

class Store {
    private state: AppState;
    private listeners: Listener[] = [];

    constructor() {
        this.state = this.getInitialState();
    }

    private getInitialState(): AppState {
        const tracks: TrackState[] = [];
        for (let i = 0; i < START_TRACKS; i++) {
            tracks.push({
                id: i,
                name: `Track ${i + 1}`,
                type: 'granular',
                steps: new Array(NUM_STEPS).fill(0),
                microtiming: new Array(NUM_STEPS).fill(0),
                params: { ...DEFAULT_GRANULAR_PARAMS } as any,
                lfos: Array.from({ length: NUM_LFOS }, () => ({ 
                    wave: 'sine', rate: 1, amount: 0, target: 'none' 
                })),
                triggers: { muted: false, soloed: false, locked: false, ignoreRandom: false },
                chokeGroup: 0
            });
        }

        return {
            tracks,
            transport: { bpm: 120, isPlaying: false, currentStep: 0, totalSteps: 0 },
            ui: { selectedTrackId: 0, selectedLfoIndex: 0, visualizerMode: 'wave', activeModal: null }
        };
    }

    getState() {
        return this.state;
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // A simple dispatcher. In a real Redux setup, this would use reducers.
    // Here we use a direct mutation pattern for simplicity while keeping the pub/sub.
    dispatch(actionType: string, payload?: any) {
        // --- Reducer Logic (Simplified) ---
        
        if (actionType === 'SET_PARAM') {
            const { trackId, param, value } = payload;
            const track = this.state.tracks[trackId];
            if (track) {
                // @ts-ignore - dynamic key access
                track.params[param] = value;
            }
        }
        
        else if (actionType === 'TOGGLE_STEP') {
            const { trackId, stepId } = payload;
            const track = this.state.tracks[trackId];
            if (track) {
                // V2 Velocity Logic: 0 -> 2 -> 3 -> 1 -> 0
                const current = track.steps[stepId];
                let next = 0;
                if (current === 0) next = 2;      // Normal
                else if (current === 2) next = 3; // Accent
                else if (current === 3) next = 1; // Ghost
                else if (current === 1) next = 0; // Off
                
                track.steps[stepId] = next;
            }
        }

        else if (actionType === 'SELECT_TRACK') {
            this.state.ui.selectedTrackId = payload;
        }

        else if (actionType === 'TRANSPORT_PLAY') {
            this.state.transport.isPlaying = true;
        }
        
        else if (actionType === 'TRANSPORT_TICK') {
            // Called by Scheduler Worker
            this.state.transport.currentStep = payload.step;
            this.state.transport.totalSteps = payload.total;
        }

        // --- Notify Listeners ---
        this.notify();
    }

    private notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

export const store = new Store();