// Track Module
import { LFO } from './LFO.js';
import { NUM_STEPS, NUM_LFOS } from '../utils/constants.js';

export class Track {
    constructor(id) {
        this.id = id;
        this.type = 'granular'; 
        this.clockDivider = 1; 
        this.lastAutoValue = 0; 
        
        this.buffer = null;
        this.rmsMap = []; 
        this.steps = new Uint8Array(NUM_STEPS).fill(0);
        this.microtiming = new Float32Array(NUM_STEPS).fill(0);
        this.lfos = Array.from({ length: NUM_LFOS }, () => new LFO());
        
        this.playhead = 0; 
        this.muted = false;
        this.soloed = false;
        this.stepLock = false; 
        this.ignoreRandom = false; 
        this.chokeGroup = 0; 
        this.activeSources = new Set(); 

        // New Playhead Reset Flags
        this.resetOnBar = false;
        this.resetOnTrig = false;
        
        // NEW: Clean Mode State (Hard AGC)
        this.cleanMode = false;

        this.bus = {
            input: null,
            trim: null, 
            hp: null,
            lp: null,
            eq: { low: null, mid: null, high: null }, 
            drive: { input: null, shaper: null }, 
            comp: null, 
            vol: null,
            pan: null
        };

        this.params = {
            // --- Common / Granular ---
            position: 0.0, 
            spray: 0.00, 
            scanSpeed: 0.00, 
            density: 20,     
            overlap: 1.0,    
            grainSize: 0.10, 
            stereoSpread: 0.0, // 0 = mono center, 1 = full random L/R
            pitch: 1.0, 
            relGrain: 2.00,  
            
            // --- NEW PARAMETERS (Sample Window) ---
            sampleStart: 0.000,
            sampleEnd: 1.000,

            // --- CHAOS PARAMETERS ---
            edgeCrunch: 0.0, // 0 to 1
            orbit: 0.0,      // 0 to 1
            
            // --- 909 / Simple Drum Params ---
            drumType: 'kick', 
            drumTune: 0.5,    
            drumDecay: 0.5,   
            
            // --- Amp Envelope ---
            ampAttack: 0.01,
            ampDecay: 0.01,
            ampRelease: 0.01,
            
            // --- Track Bus (Mixer) ---
            hpFilter: 20,
            filter: 20000, 
            volume: 0.8, 
            pan: 0,
            
            // --- New Mixer Params ---
            gain: 1.0, 
            eqLow: 0,  
            eqMid: 0,  
            eqHigh: 0, 
            eqMidFreq: 1000,
            drive: 0, 
            comp: 0,  
            sendA: 0,
            sendB: 0
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
                if (time > 0) src.stop(time);
                else src.stop();
            } catch(e) {}
        });
        this.activeSources.clear();
    }
}