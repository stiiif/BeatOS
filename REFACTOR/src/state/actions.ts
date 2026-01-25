import { TrackParams, InstrumentType, LFO } from '../types/audio';
import { TrackState } from '../types/state';

// --- Action Types ---
export const ActionTypes = {
    // Transport
    TRANSPORT_PLAY: 'TRANSPORT_PLAY',
    TRANSPORT_STOP: 'TRANSPORT_STOP',
    SET_BPM: 'SET_BPM',
    TRANSPORT_TICK: 'TRANSPORT_TICK', // Updates current step from Scheduler

    // UI
    SELECT_TRACK: 'SELECT_TRACK',
    SET_VISUALIZER_MODE: 'SET_VISUALIZER_MODE',
    OPEN_MODAL: 'OPEN_MODAL',
    CLOSE_MODAL: 'CLOSE_MODAL',
    SELECT_LFO: 'SELECT_LFO',

    // Track - Structure
    ADD_TRACK: 'ADD_TRACK',
    DELETE_TRACK: 'DELETE_TRACK', // Optional future feature
    CLEAR_TRACK: 'CLEAR_TRACK',
    
    // Track - Parameters
    SET_TRACK_TYPE: 'SET_TRACK_TYPE',
    UPDATE_TRACK_PARAM: 'UPDATE_TRACK_PARAM',
    UPDATE_TRACK_PARAMS_BULK: 'UPDATE_TRACK_PARAMS_BULK', // For randomization/presets
    
    // Track - Sequencer
    TOGGLE_STEP: 'TOGGLE_STEP', // Handles the 0->2->3->1 logic
    SET_STEP_VALUE: 'SET_STEP_VALUE', // Direct set (for automation/presets)
    
    // Track - State
    TOGGLE_MUTE: 'TOGGLE_MUTE',
    TOGGLE_SOLO: 'TOGGLE_SOLO',
    TOGGLE_LOCK: 'TOGGLE_LOCK',
    TOGGLE_IGNORE_RANDOM: 'TOGGLE_IGNORE_RANDOM',
    SET_CHOKE_GROUP: 'SET_CHOKE_GROUP',

    // Track - LFO
    UPDATE_LFO: 'UPDATE_LFO',

    // Track - Sample
    LOAD_SAMPLE_METADATA: 'LOAD_SAMPLE_METADATA', // Buffer handled by Service, State keeps name/duration

    // Global
    LOAD_STATE: 'LOAD_STATE', // For loading presets/snapshots
} as const;

// --- Action Interfaces ---

export interface BaseAction {
    type: string;
    payload?: any;
}

// Transport Actions
export interface SetBpmAction extends BaseAction { type: typeof ActionTypes.SET_BPM; payload: number; }
export interface TransportTickAction extends BaseAction { type: typeof ActionTypes.TRANSPORT_TICK; payload: { step: number; total: number }; }

// Track Actions
export interface ToggleStepAction extends BaseAction { type: typeof ActionTypes.TOGGLE_STEP; payload: { trackId: number; stepId: number }; }
export interface UpdateParamAction extends BaseAction { type: typeof ActionTypes.UPDATE_TRACK_PARAM; payload: { trackId: number; param: keyof TrackParams; value: number }; }
export interface SetTrackTypeAction extends BaseAction { type: typeof ActionTypes.SET_TRACK_TYPE; payload: { trackId: number; type: InstrumentType; defaults: Partial<TrackParams> }; }
export interface LoadSampleAction extends BaseAction { type: typeof ActionTypes.LOAD_SAMPLE_METADATA; payload: { trackId: number; name: string; duration: number }; }

export type Action = BaseAction; // Union of all specific actions in a full implementation