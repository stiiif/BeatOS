import type { TrackParams } from '../types/audio';

export const DEFAULT_GRANULAR_PARAMS: Partial<TrackParams> = {
    position: 0.0, 
    spray: 0.0, 
    scanSpeed: 0.0, 
    density: 15, 
    overlap: 3, 
    grainSize: 0.25, 
    pitch: 1.0, 
    relGrain: 0.4,
    ampAttack: 0.01, 
    ampDecay: 0.01, 
    ampRelease: 0.1,
    filter: 20000, 
    hpFilter: 20, 
    volume: 0.8, 
    pan: 0
};

export const DEFAULT_DRUM_PARAMS: Partial<TrackParams> = {
    drumType: 'kick', 
    drumTune: 0.5, 
    drumDecay: 0.5,
    filter: 20000, 
    hpFilter: 20, 
    volume: 0.8, 
    pan: 0
};

export interface InstrumentConfig {
    engine: 'simple-drum' | 'granular';
    bufferType?: 'kick' | 'snare' | 'hihat' | 'texture'; 
    params: Partial<TrackParams>;
}

export interface HeuristicRule {
    check: (name: string) => boolean;
    config: InstrumentConfig;
}

export const INSTRUMENT_HEURISTICS: HeuristicRule[] = [
    {
        check: (n) => /kick|surdo|bombo|tambora|manman|boula|barril|atumpan|bass_drum/.test(n),
        config: {
            engine: 'simple-drum',
            params: { 
                drumType: 'kick', 
                drumTune: 0.3, 
                drumDecay: 0.6, 
                filter: 5000, 
                hpFilter: 20 
            }
        }
    },
    {
        check: (n) => /snare|caixa|repinique|kidi|sabar|djembe|conga|bongo|kaganu|snare_drum/.test(n),
        config: {
            engine: 'simple-drum',
            params: { 
                drumType: 'snare', 
                drumTune: 0.6, 
                drumDecay: 0.4, 
                filter: 12000, 
                hpFilter: 100 
            }
        }
    },
    {
        check: (n) => /hat|shaker|maraca|ganza|cascabeles|kata|guiro|shekere|hi_hat/.test(n),
        config: {
            engine: 'simple-drum',
            params: { 
                drumTune: 0.7, 
                drumDecay: 0.3, 
                filter: 20000, 
                hpFilter: 2000 
            }
        }
    },
    {
        check: (n) => /bell|agogo|ogan|clave|wood|triangle|gong|chico|cowbell/.test(n),
        config: {
            engine: 'granular',
            bufferType: 'texture',
            params: { 
                spray: 0, 
                grainSize: 0.05, 
                density: 20, 
                pitch: 2.0, 
                relGrain: 0.3,
                ampAttack: 0.001, 
                ampDecay: 0.15, 
                ampRelease: 0.1,
                filter: 15000, 
                hpFilter: 500 
            }
        }
    },
    {
        check: (n) => /guitar|cuatro|charango|harp|piano|kora|ngoma|synth|bass/.test(n),
        config: {
            engine: 'granular',
            bufferType: 'texture',
            params: { 
                spray: 0.02, 
                grainSize: 0.15, 
                density: 10, 
                pitch: 1.0, 
                relGrain: 0.8, 
                filter: 10000, 
                hpFilter: 100 
            }
        }
    },
    {
        check: () => true, // Catch-all
        config: {
            engine: 'simple-drum',
            params: { 
                drumType: 'cymbal', 
                drumTune: 0.5, 
                drumDecay: 0.4 
            }
        }
    }
];