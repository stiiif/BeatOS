import { EventBus } from '../utils/EventBus.js';
import { ACTIONS } from './Actions.js';
import { START_TRACKS, DEFAULT_BPM, MAX_TRACKS, NUM_STEPS, NUM_LFOS } from '../utils/constants.js';

// Helper to create a clean track object (Data Only)
const createTrack = (id) => ({
    id,
    type: 'granular', // granular, simple-drum, automation
    muted: false,
    soloed: false,
    steps: new Uint8Array(NUM_STEPS).fill(0),
    params: {
        position: 0.0,
        spray: 0.0,
        density: 15,
        grainSize: 0.25,
        pitch: 1.0,
        overlap: 3,
        volume: 0.8,
        pan: 0,
        filter: 20000,
        hpFilter: 20,
        // ... add defaults from original Track.js as needed
    },
    // LFOs as data arrays
    lfos: Array.from({ length: NUM_LFOS }, () => ({
        wave: 'sine', rate: 1.0, amount: 0.0, target: 'none'
    }))
});

const initialState = {
    bpm: DEFAULT_BPM,
    isPlaying: false,
    currentStep: 0,
    selectedTrackId: 0,
    tracks: [] 
};

class Store extends EventBus {
    constructor() {
        super();
        this.state = new Proxy(JSON.parse(JSON.stringify(initialState)), {
            set: (target, key, value) => {
                const previousValue = target[key];
                target[key] = value;
                this.emit('STATE_CHANGED', { key, value, previousValue });
                // Granular event
                this.emit(`STATE_CHANGED:${key}`, { value, previousValue });
                return true;
            }
        });
    }

    dispatch(actionType, payload) {
        // Emit action event for logging/middleware
        this.emit('ACTION_DISPATCHED', { actionType, payload });

        switch (actionType) {
            case ACTIONS.INIT_APP:
                this.initApp();
                break;

            case ACTIONS.ADD_TRACK:
                this.addTrack();
                break;

            case ACTIONS.SELECT_TRACK:
                this.state.selectedTrackId = payload.trackId;
                break;

            case ACTIONS.UPDATE_PARAM:
                this.updateParam(payload);
                break;

            case ACTIONS.TOGGLE_STEP:
                this.toggleStep(payload);
                break;
                
            case ACTIONS.TOGGLE_MUTE:
                this.toggleTrackState(payload.trackId, 'muted');
                break;

            case ACTIONS.SET_CURRENT_STEP:
                this.state.currentStep = payload.step;
                break;

            default:
                console.warn(`Unknown action: ${actionType}`);
        }
    }

    // --- Reducer Logic (Mutations) ---

    initApp() {
        const tracks = [];
        for (let i = 0; i < START_TRACKS; i++) {
            tracks.push(createTrack(i));
        }
        this.state.tracks = tracks;
    }

    addTrack() {
        if (this.state.tracks.length >= MAX_TRACKS) return;
        const newId = this.state.tracks.length;
        // We must re-assign the array to trigger the Proxy trap for 'tracks'
        this.state.tracks = [...this.state.tracks, createTrack(newId)];
    }

    updateParam({ trackId, param, value }) {
        const track = this.state.tracks[trackId];
        if (track) {
            track.params[param] = value;
            // Force update notification for deep property? 
            // The Proxy on root 'state' catches top-level keys. 
            // For deep nested updates, we might need to manually emit or use a deep proxy.
            // For now, let's manually emit a specific track update event for performance.
            this.emit(`TRACK_UPDATED:${trackId}`, { param, value });
        }
    }

    toggleStep({ trackId, stepIndex }) {
        const track = this.state.tracks[trackId];
        if (track) {
            // Cycle velocity: 0 -> 2 (Normal) -> 3 (Accent) -> 1 (Ghost) -> 0
            const current = track.steps[stepIndex];
            let next = 0;
            if (current === 0) next = 2;
            else if (current === 2) next = 3;
            else if (current === 3) next = 1;
            else if (current === 1) next = 0;
            
            track.steps[stepIndex] = next;
            this.emit(`TRACK_UPDATED:${trackId}`, { stepIndex, value: next });
        }
    }
    
    toggleTrackState(trackId, key) {
        const track = this.state.tracks[trackId];
        if (track) {
            track[key] = !track[key];
            this.emit(`TRACK_UPDATED:${trackId}`, { key, value: track[key] });
        }
    }
}

export const appStore = new Store();