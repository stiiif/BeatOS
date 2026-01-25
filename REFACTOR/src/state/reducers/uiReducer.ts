import { UIState } from '../../types/state';
import { ActionTypes, Action } from '../actions';

const initialState: UIState = {
    selectedTrackId: 0,
    selectedLfoIndex: 0,
    visualizerMode: 'wave',
    activeModal: null
};

export function uiReducer(state: UIState = initialState, action: Action): UIState {
    switch (action.type) {
        case ActionTypes.SELECT_TRACK:
            return { ...state, selectedTrackId: action.payload };

        case ActionTypes.SELECT_LFO:
            return { ...state, selectedLfoIndex: action.payload };

        case ActionTypes.SET_VISUALIZER_MODE:
            return { ...state, visualizerMode: action.payload };

        case ActionTypes.OPEN_MODAL:
            return { ...state, activeModal: action.payload };

        case ActionTypes.CLOSE_MODAL:
            return { ...state, activeModal: null };

        case ActionTypes.LOAD_STATE:
            // Reset selection to 0 on load to avoid out-of-bounds
            return { ...state, selectedTrackId: 0, selectedLfoIndex: 0 };

        default:
            return state;
    }
}