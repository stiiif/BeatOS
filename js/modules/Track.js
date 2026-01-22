// Track Module
import { LFO } from './LFO.js';
import { NUM_STEPS } from '../utils/constants.js';

export class Track {
    constructor(id) {
        this.id = id;
        this.buffer = null;
        this.steps = new Array(NUM_STEPS).fill(false);
        this.lfos = [new LFO(), new LFO(), new LFO()];
        this.muted = false;
        this.soloed = false;
        this.stepLock = false; // When true, this track's steps cannot be stolen by other tracks in the group
        this.params = {
            // Granular Params
            position: 0.0, 
            spray: 0.00, 
            density: 15, 
            grainSize: 0.01,
            pitch: 1.0, 
            relGrain: 0.4, // Formerly "release" - duration of grain generation
            
            // Amp Envelope Params (ADR)
            ampAttack: 0.01,
            ampDecay: 0.1,
            ampRelease: 0.3,
            
            // Filter & Mix
            volume: 0.8, 
            filter: 10000, 
            hpFilter: 20,
            pan: 0 // -1 (left) to 1 (right), 0 is center
        };
    }
}