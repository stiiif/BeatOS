import type { TransportState } from '../../types/state';
import { ActionTypes, type Action } from '../actions';

const initialState: TransportState = {
    bpm: 120,
    isPlaying: false,
    currentStep: 0,
    totalSteps: 0
};

export function transportReducer(state: TransportState = initialState, action: Action): TransportState {
    switch (action.type) {
        case ActionTypes.TRANSPORT_PLAY:
            return { ...state, isPlaying: true };

        case ActionTypes.TRANSPORT_STOP:
            return { ...state, isPlaying: false, currentStep: 0, totalSteps: 0 };

        case ActionTypes.SET_BPM:
            const bpm = Math.max(30, Math.min(300, action.payload));
            return { ...state, bpm };

        case ActionTypes.TRANSPORT_TICK:
            return { 
                ...state, 
                currentStep: action.payload.step,
                totalSteps: action.payload.total
            };

        case ActionTypes.LOAD_STATE:
            if (action.payload.transport) {
                return { 
                    ...state, 
                    bpm: action.payload.transport.bpm || 120,
                    isPlaying: false,
                    currentStep: 0
                };
            }
            return state;

        default:
            return state;
    }
}