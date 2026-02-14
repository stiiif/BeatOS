// Constants & Configuration
export const START_TRACKS = 8;
export const MAX_TRACKS = 32;
export const NUM_STEPS = 64; // Set to 64
export const NUM_LFOS = 2;         // Default modulator count for granular tracks
export const NUM_FX_MODS = 2;      // Default modulator count for FX engines
export const MAX_MODULATORS = 4;   // Hard ceiling for add/remove
export const TRACKS_PER_GROUP = 4; // Changed from 4 to 8 for V2 patterns

export const DEFAULT_BPM = 78;
export const LOOKAHEAD = 25.0;
export const SCHEDULE_AHEAD_TIME = 0.1;

// Automation Intensity Zones (Min/Max Release Times)
export const AUTOMATION_INTENSITIES = {
    1: { min: 0.01, max: 0.2, name: 'Very Short' },
    2: { min: 0.2, max: 0.6, name: 'Short' },
    3: { min: 0.6, max: 1.2, name: 'Medium' },
    4: { min: 1.2, max: 1.6, name: 'Long' },
    5: { min: 1.6, max: 2.0, name: 'Very Long' }
};

// New Velocity Constants for V2 Engine
export const VELOCITY_GAINS = {
    0: 0.0,  // Off
    1: 0.25,  // Ghost (Low Velocity)
    2: 0.66, // Normal (Medium Velocity)
    3: 1.0   // Accent (High Velocity)
};

// Modulation Targets for LFOs
export const MODULATION_TARGETS = [
    { id: 'position', name: 'Position' },
    { id: 'spray', name: 'Spray' },
    { id: 'sampleStart', name: 'Start' },
    { id: 'sampleEnd', name: 'End' },
    { id: 'scanSpeed', name: 'Speed' },
    { id: 'density', name: 'Density' },
    { id: 'grainSize', name: 'Size' },
    { id: 'stereoSpread', name: 'Stereo' },
    { id: 'overlap', name: 'Overlap' },
    { id: 'pitch', name: 'Pitch' },
    { id: 'pitchSemi', name: 'Pitch ST' },
    { id: 'pitchFine', name: 'Detune' },
    { id: 'chordSpread', name: 'Chord Spr' },
    { id: 'relGrain', name: 'Rel Dur' },
    { id: 'ampAttack', name: 'Attack' },
    { id: 'ampDecay', name: 'Decay' },
    { id: 'ampRelease', name: 'Release' },
    { id: 'hpFilter', name: 'HPF' },
    { id: 'filter', name: 'LPF' },
    { id: 'volume', name: 'Vol' },
    { id: 'pan', name: 'Pan' },
    { id: 'edgeCrunch', name: 'Crunch' },
    { id: 'orbit', name: 'Orbit' }
];