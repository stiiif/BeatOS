export type InstrumentType = 'granular' | 'simple-drum' | 'automation';

export interface GranularParams {
    position: number;
    spray: number;
    scanSpeed: number;
    density: number;
    overlap: number;
    grainSize: number;
    pitch: number;
    relGrain: number;
    ampAttack: number;
    ampDecay: number;
    ampRelease: number;
    filter: number;
    hpFilter: number;
    volume: number;
    pan: number;
}

export interface DrumParams {
    drumType: string; // 'kick' | 'snare' | 'closed-hat' | 'open-hat' | 'cymbal'
    drumTune: number;
    drumDecay: number;
    filter: number;
    hpFilter: number;
    volume: number;
    pan: number;
}

export interface AutomationParams {
    clockDivider: number;
}

// Union type for safe access to all possible parameters
export type TrackParams = GranularParams & DrumParams & AutomationParams;

// LFO Definition
export interface LFO {
    wave: 'sine' | 'square' | 'sawtooth' | 'random' | 'noise';
    rate: number;
    amount: number;
    target: keyof TrackParams | 'none';
    lastRandom?: number;
    randomHoldTime?: number;
}