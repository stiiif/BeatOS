import { NUM_STEPS, NUM_LFOS } from '../utils/constants.js';

/**
 * TrackModel - Pure data representation of a track.
 * Contains sequence data and parameters only, NO audio nodes.
 * This structure makes it easy to sync with the AudioWorklet via SAB or JSON.
 */
export class TrackModel {
    constructor(id) {
        this.id = id;
        this.type = 'granular'; // granular, simple-drum, automation
        
        // Rhythmic Data
        // 0=off, 1=ghost, 2=normal, 3=accent
        this.steps = new Uint8Array(NUM_STEPS).fill(0);
        
        // Microtiming stored in TICKS (PPQ based) for tempo-agnostic shuffle
        this.microtimingTicks = new Int16Array(NUM_STEPS).fill(0);
        
        // Playback parameters
        this.params = {
            position: 0.0,
            spray: 0.0,
            scanSpeed: 0.0,
            density: 15,
            grainSize: 0.2,
            pitch: 1.0,
            volume: 0.8,
            pan: 0.0,
            filter: 20000,
            hpFilter: 20,
            ampAttack: 0.01,
            ampDecay: 0.1,
            ampRelease: 0.3
        };

        // Modulator state (LFO Config)
        this.lfos = Array.from({ length: NUM_LFOS }, () => ({
            wave: 'sine',
            rate: 1.0,
            amount: 0.0,
            target: 'none'
        }));

        // Routing & Logic
        this.chokeGroup = 0;
        this.isMuted = false;
        this.isSoloed = false;
        this.isLocked = false;
        
        // Metadata
        this.sampleName = "";
        this.hasBuffer = false;
    }

    /**
     * Serializes for postMessage or SharedArrayBuffer sync.
     */
    serialize() {
        return JSON.parse(JSON.stringify(this));
    }
}