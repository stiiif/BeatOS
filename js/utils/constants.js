// Constants & Configuration
export const START_TRACKS = 16;
export const MAX_TRACKS = 32;
export const NUM_STEPS = 32; // Set to 64
export const NUM_LFOS = 3;
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