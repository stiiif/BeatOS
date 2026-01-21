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
            position: 0.2, spray: 0.05, density: 15, grainSize: 0.1,
            pitch: 1.0, attack: 0.01, release: 0.4, volume: 0.8, filter: 8000, hpFilter: 20,
            pan: 0 // -1 (left) to 1 (right), 0 is center
        };
    }
}
