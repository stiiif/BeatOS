// Constants & Configuration
export const START_TRACKS = 16;
export const MAX_TRACKS = 32;
export const NUM_STEPS = 32; // Set to 64
export const NUM_LFOS = 3;         // Default modulator count for granular tracks
export const NUM_FX_MODS = 3;      // Default modulator count for FX engines
export const MAX_MODULATORS = 8;   // Hard ceiling for add/remove
export const TRACKS_PER_GROUP = 8; // Changed from 4 to 8 for V2 patterns

export const DEFAULT_BPM = 120;
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
    1: 0.3,  // Ghost (Low Velocity)
    2: 0.75, // Normal (Medium Velocity)
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
    { id: 'orbit', name: 'Orbit' },
    // Sampler engine targets
    { id: 'smp_start', name: 'S:Start' },
    { id: 'smp_end', name: 'S:End' },
    { id: 'smp_pitch', name: 'S:Pitch' },
    { id: 'smp_filter', name: 'S:LPF' },
    { id: 'smp_hpFilter', name: 'S:HPF' },
    { id: 'smp_volume', name: 'S:Vol' },
    { id: 'smp_attack', name: 'S:Atk' },
    { id: 'smp_decay', name: 'S:Dec' },
    { id: 'smp_sustain', name: 'S:Sus' },
    { id: 'smp_release', name: 'S:Rel' },
    { id: 'smp_voices', name: 'S:Voices' },
];