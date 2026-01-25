import type { TrackParams, InstrumentType, LFO } from '../types/audio';
import type { TrackState } from '../types/state';

// --- Action Types ---
export const ActionTypes = {
    // Transport
    TRANSPORT_PLAY: 'TRANSPORT_PLAY',
    TRANSPORT_STOP: 'TRANSPORT_STOP',
    SET_BPM: 'SET_BPM',
    TRANSPORT_TICK: 'TRANSPORT_TICK', 

    // UI
    SELECT_TRACK: 'SELECT_TRACK',
    SET_VISUALIZER_MODE: 'SET_VISUALIZER_MODE',
    OPEN_MODAL: 'OPEN_MODAL',
    CLOSE_MODAL: 'CLOSE_MODAL',
    SELECT_LFO: 'SELECT_LFO',

    // Track
    ADD_TRACK: 'ADD_TRACK',
    CLEAR_TRACK: 'CLEAR_TRACK',
    SET_TRACK_TYPE: 'SET_TRACK_TYPE',
    UPDATE_TRACK_PARAM: 'UPDATE_TRACK_PARAM',
    UPDATE_TRACK_PARAMS_BULK: 'UPDATE_TRACK_PARAMS_BULK',
    TOGGLE_STEP: 'TOGGLE_STEP',
    SET_STEP_VALUE: 'SET_STEP_VALUE',
    TOGGLE_MUTE: 'TOGGLE_MUTE',
    TOGGLE_SOLO: 'TOGGLE_SOLO',
    TOGGLE_LOCK: 'TOGGLE_LOCK',
    TOGGLE_IGNORE_RANDOM: 'TOGGLE_IGNORE_RANDOM',
    SET_CHOKE_GROUP: 'SET_CHOKE_GROUP',
    UPDATE_LFO: 'UPDATE_LFO',
    LOAD_SAMPLE_METADATA: 'LOAD_SAMPLE_METADATA',
    LOAD_STATE: 'LOAD_STATE',
} as const;

// --- Action Interfaces ---

export interface BaseAction {
    type: string;
    payload?: any;
}

export interface SetBpmAction extends BaseAction { type: typeof ActionTypes.SET_BPM; payload: number; }
export interface TransportTickAction extends BaseAction { type: typeof ActionTypes.TRANSPORT_TICK; payload: { step: number; total: number }; }
export interface ToggleStepAction extends BaseAction { type: typeof ActionTypes.TOGGLE_STEP; payload: { trackId: number; stepId: number }; }
export interface UpdateParamAction extends BaseAction { type: typeof ActionTypes.UPDATE_TRACK_PARAM; payload: { trackId: number; param: keyof TrackParams; value: number }; }
export interface SetTrackTypeAction extends BaseAction { type: typeof ActionTypes.SET_TRACK_TYPE; payload: { trackId: number; type: InstrumentType; defaults: Partial<TrackParams> }; }
export interface LoadSampleAction extends BaseAction { type: typeof ActionTypes.LOAD_SAMPLE_METADATA; payload: { trackId: number; name: string; duration: number }; }

export type Action = BaseAction;