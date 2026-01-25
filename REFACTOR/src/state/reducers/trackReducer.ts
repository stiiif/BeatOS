import type { TrackState } from '../../types/state';
import type { TrackParams } from '../../types/audio';
import { ActionTypes, type Action } from '../actions';
import { START_TRACKS, NUM_STEPS, NUM_LFOS } from '../../config/constants';
import { DEFAULT_GRANULAR_PARAMS, DEFAULT_DRUM_PARAMS } from '../../config/mappings';

export const createDefaultTrack = (id: number): TrackState => ({
    id,
    name: `Track ${id + 1}`,
    type: 'granular',
    steps: new Array(NUM_STEPS).fill(0),
    microtiming: new Array(NUM_STEPS).fill(0),
    params: { ...DEFAULT_GRANULAR_PARAMS } as TrackParams, 
    lfos: Array.from({ length: NUM_LFOS }, () => ({ 
        wave: 'sine', rate: 1, amount: 0, target: 'none' 
    })),
    triggers: { muted: false, soloed: false, locked: false, ignoreRandom: false },
    chokeGroup: 0
});

const generateInitialTracks = (): TrackState[] => {
    const tracks: TrackState[] = [];
    for (let i = 0; i < START_TRACKS; i++) {
        tracks.push(createDefaultTrack(i));
    }
    return tracks;
};

export function trackReducer(state: TrackState[] = generateInitialTracks(), action: Action): TrackState[] {
    switch (action.type) {
        case ActionTypes.ADD_TRACK:
            return [...state, createDefaultTrack(state.length)];

        case ActionTypes.CLEAR_TRACK: {
            const trackId = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                return {
                    ...t,
                    steps: new Array(NUM_STEPS).fill(0)
                };
            });
        }

        case ActionTypes.TOGGLE_STEP: {
            const { trackId, stepId } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;

                const newSteps = [...t.steps];
                const currentVal = newSteps[stepId];
                let nextVal = 0;

                if (t.type === 'automation') {
                    nextVal = (currentVal + 1) % 6;
                } else {
                    if (currentVal === 0) nextVal = 2;
                    else if (currentVal === 2) nextVal = 3;
                    else if (currentVal === 3) nextVal = 1;
                    else if (currentVal === 1) nextVal = 0;
                }

                newSteps[stepId] = nextVal;
                return { ...t, steps: newSteps };
            });
        }

        case ActionTypes.SET_STEP_VALUE: {
            const { trackId, stepId, value } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                const newSteps = [...t.steps];
                newSteps[stepId] = value;
                return { ...t, steps: newSteps };
            });
        }

        case ActionTypes.UPDATE_TRACK_PARAM: {
            const { trackId, param, value } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                return {
                    ...t,
                    params: { ...t.params, [param]: value }
                };
            });
        }

        case ActionTypes.UPDATE_TRACK_PARAMS_BULK: {
            const { trackId, params } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                return {
                    ...t,
                    params: { ...t.params, ...params }
                };
            });
        }

        case ActionTypes.SET_TRACK_TYPE: {
            const { trackId, type, defaults } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                
                const baseParams = type === 'simple-drum' ? DEFAULT_DRUM_PARAMS : DEFAULT_GRANULAR_PARAMS;
                
                return {
                    ...t,
                    type: type,
                    params: { ...t.params, ...baseParams, ...defaults },
                    sample: type === 'simple-drum' ? undefined : t.sample
                };
            });
        }

        case ActionTypes.TOGGLE_MUTE:
            return state.map(t => t.id === action.payload ? { ...t, triggers: { ...t.triggers, muted: !t.triggers.muted } } : t);

        case ActionTypes.TOGGLE_SOLO:
            return state.map(t => t.id === action.payload ? { ...t, triggers: { ...t.triggers, soloed: !t.triggers.soloed } } : t);

        case ActionTypes.TOGGLE_LOCK:
            return state.map(t => t.id === action.payload ? { ...t, triggers: { ...t.triggers, locked: !t.triggers.locked } } : t);
            
        case ActionTypes.TOGGLE_IGNORE_RANDOM:
            return state.map(t => t.id === action.payload ? { ...t, triggers: { ...t.triggers, ignoreRandom: !t.triggers.ignoreRandom } } : t);

        case ActionTypes.SET_CHOKE_GROUP:
             return state.map(t => t.id === action.payload.trackId ? { ...t, chokeGroup: action.payload.group } : t);

        case ActionTypes.UPDATE_LFO: {
            const { trackId, lfoIndex, lfoData } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                const newLfos = [...t.lfos];
                newLfos[lfoIndex] = { ...newLfos[lfoIndex], ...lfoData };
                return { ...t, lfos: newLfos };
            });
        }

        case ActionTypes.LOAD_SAMPLE_METADATA: {
            const { trackId, name, duration } = action.payload;
            return state.map(t => {
                if (t.id !== trackId) return t;
                return {
                    ...t,
                    type: 'granular',
                    sample: { name, duration }
                };
            });
        }

        case ActionTypes.LOAD_STATE:
            if (action.payload.tracks) {
                return action.payload.tracks;
            }
            return state;

        default:
            return state;
    }
}