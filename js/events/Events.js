/**
 * Central dictionary of all application events.
 * Using constants prevents typos and makes it easier to track event usage.
 */
export const EVENTS = {
    // --- Application State ---
    APP_INITIALIZED: 'app:initialized',
    AUDIO_INITIALIZED: 'audio:initialized',

    // --- Transport / Playback ---
    PLAYBACK_START: 'playback:start',
    PLAYBACK_STOP: 'playback:stop',
    PLAYBACK_STEP: 'playback:step', // Fired on every sequencer step
    BPM_CHANGED: 'playback:bpm_changed',

    // --- Track Management ---
    TRACK_ADDED: 'track:added',
    TRACK_SELECTED: 'track:selected',
    TRACK_UPDATED: 'track:updated', // Generic update (name, color, etc)
    TRACK_STATE_CHANGED: 'track:state_changed', // Mute, Solo, Lock status
    
    // --- Sequencer Grid ---
    STEP_TOGGLED: 'grid:step_toggled',
    PATTERN_CLEARED: 'grid:pattern_cleared',
    PATTERN_RANDOMIZED: 'grid:pattern_randomized',

    // --- Sound Parameters ---
    PARAM_CHANGED: 'param:changed', // Knob/Slider movement
    LFO_CHANGED: 'lfo:changed',
    SAMPLE_LOADED: 'sample:loaded',
    
    // --- Global Modules ---
    GROOVE_APPLIED: 'global:groove_applied',
    SNAPSHOT_TAKEN: 'global:snapshot_taken',
    SNAPSHOT_RESTORED: 'global:snapshot_restored',
    
    // --- Visuals ---
    VISUALIZER_UPDATE: 'visualizer:update'
};