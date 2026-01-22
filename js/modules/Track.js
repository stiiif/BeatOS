// Track Module
import { LFO } from './LFO.js';
import { NUM_STEPS } from '../utils/constants.js';

export class Track {
    constructor(id) {
        this.id = id;
        this.type = 'granular'; // 'granular' or 'simple-drum'
        this.buffer = null;
        this.rmsMap = []; 
        this.steps = new Array(NUM_STEPS).fill(false);
        this.lfos = [new LFO(), new LFO(), new LFO()];
        
        this.playhead = 0; 
        
        this.muted = false;
        this.soloed = false;
        this.stepLock = false; 

        this.bus = {
            input: null,
            hp: null,
            lp: null,
            vol: null,
            pan: null
        };

        this.params = {
            // --- Common / Granular ---
            position: 0.0, 
            spray: 0.00, 
            scanSpeed: 0.0,
            density: 15, 
            overlap: 0, 
            grainSize: 0.05,
            pitch: 1.0, 
            relGrain: 0.4,
            
            // --- 909 / Simple Drum Params ---
            drumType: 'kick', // kick, snare, closed-hat, open-hat, cymbal
            drumTune: 0.5,    // Simple tuning parameter (0-1)
            drumDecay: 0.5,   // Simple decay parameter (0-1)
            
            // --- Amp Envelope ---
            ampAttack: 0.01,
            ampDecay: 0.1,
            ampRelease: 0.3,
            
            // --- Track Bus ---
            hpFilter: 20,
            filter: 20000, 
            volume: 0.8, 
            pan: 0 
        };
    }
}