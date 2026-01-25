import { NUM_STEPS, NUM_LFOS } from '../utils/constants.js';
import { LFO } from './LFO.js';

/**
 * Creates a pure data object representing a Track.
 * No AudioNodes, Buffers, or runtime logic should be stored here.
 * @param {number} id 
 * @returns {Object} Clean track data structure
 */
export const createTrackData = (id) => {
    return {
        id,
        type: 'granular', // 'granular', 'simple-drum', 'automation'
        
        // State flags
        muted: false,
        soloed: false,
        stepLock: false,
        ignoreRandom: false,
        
        // Sequencer Data
        // 0=Off, 1=Ghost, 2=Normal, 3=Accent
        steps: new Uint8Array(NUM_STEPS).fill(0),
        microtiming: new Float32Array(NUM_STEPS).fill(0),
        
        // Audio Parameters (Pure Data)
        params: {
            // Granular
            position: 0.0,
            spray: 0.0,
            scanSpeed: 0.0,
            density: 15,
            grainSize: 0.25,
            pitch: 1.0,
            overlap: 3,
            relGrain: 0.4,
            
            // Amp Envelope
            ampAttack: 0.01,
            ampDecay: 0.01,
            ampRelease: 0.1,
            
            // Drum Engine
            drumType: 'kick',
            drumTune: 0.5,
            drumDecay: 0.5,
            
            // Mixer
            volume: 0.8,
            pan: 0,
            filter: 20000,
            hpFilter: 20
        },
        
        // Modulation
        lfos: Array.from({ length: NUM_LFOS }, () => ({
            wave: 'sine',
            rate: 1.0,
            amount: 0.0,
            target: 'none'
        })),
        
        // Grouping
        chokeGroup: 0,
        
        // Sample Info (Metadata only, no Buffers)
        sampleName: null
    };
};