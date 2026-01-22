// Track Module
import { LFO } from './LFO.js';
import { NUM_STEPS } from '../utils/constants.js';

export class Track {
    constructor(id) {
        this.id = id;
        this.buffer = null;
        this.rmsMap = []; // Idea 3: Map of loud/silent regions
        this.steps = new Array(NUM_STEPS).fill(false);
        this.lfos = [new LFO(), new LFO(), new LFO()];
        
        // State for Idea 2 (Scan) & Idea 5 (Continuous Play)
        this.playhead = 0; 
        
        this.muted = false;
        this.soloed = false;
        this.stepLock = false; 

        // Persistent Audio Bus Nodes (Created in TrackManager/AudioEngine)
        this.bus = {
            input: null,
            hp: null,
            lp: null,
            vol: null,
            pan: null
        };

        this.params = {
            // --- Grain Generation ---
            position: 0.0, 
            spray: 0.00, 
            scanSpeed: 0.0, // Idea 2: Speed of playhead movement (0 = static)
            
            density: 15, 
            overlap: 0, // Idea 1: If > 0, overrides density to ensure layer overlap
            
            grainSize: 0.05,
            pitch: 1.0, 
            relGrain: 0.4, // Duration of the grain cloud (Trigger window)
            
            // --- Amp Envelope (Global per trigger) ---
            ampAttack: 0.01,
            ampDecay: 0.1,
            ampRelease: 0.3,
            
            // --- Track Bus (Global Effects) ---
            hpFilter: 20,
            filter: 20000, 
            volume: 0.8, 
            pan: 0 
        };
    }
}