// Track Module
import { LFO } from './LFO.js';
import { NUM_STEPS, NUM_LFOS } from '../utils/constants.js';

export class Track {
    constructor(id) {
        this.id = id;
        this.type = 'granular'; // 'granular', 'simple-drum', or 'automation'
        
        // Automation specific
        this.clockDivider = 1; // 1=1x, 2=1/2x, 4=1/4x, 8=1/8x
        this.lastAutoValue = 0; // To track state changes
        
        this.buffer = null;
        this.rmsMap = []; 
        // For automation, steps will hold integers 0-5
        this.steps = new Array(NUM_STEPS).fill(0); 
        
        this.lfos = Array.from({ length: NUM_LFOS }, () => new LFO());
        
        this.playhead = 0; 
        
        this.muted = false;
        this.soloed = false;
        this.stepLock = false; 
        this.ignoreRandom = false; 
        
        // --- NEW: Choke Group Logic ---
        this.chokeGroup = 0; // 0 = None, 1-8 = Shared Choke Groups
        this.activeSources = new Set(); // Store active WebAudio nodes to stop them

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
            drumType: 'kick', 
            drumTune: 0.5,    
            drumDecay: 0.5,   
            
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

    addSource(source) {
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
        };
    }

    stopAllSources(time = 0) {
        this.activeSources.forEach(src => {
            try {
                // Schedule stop if time is provided, otherwise stop immediately
                if (time > 0) src.stop(time);
                else src.stop();
            } catch(e) {
                // Ignore errors if source already stopped
            }
        });
        this.activeSources.clear();
    }
}