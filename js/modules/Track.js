// Track Module
import { LFO } from './modulators/LFO.js';
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
        // Per-step pitch overrides: null = use track defaults, array = semitone offsets
        this.stepPitches = new Array(NUM_STEPS).fill(null);
        // Modulator slots — backward compat: .lfos still works
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
        
        // Scan Sync: lock scanSpeed to sample/loop ratio
        this.scanSync = false;
        this.scanSyncMultiplier = 1; // x2 = 2, /2 = 0.5, etc.
        
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
            pitch: 1.0,         // Legacy ratio — kept for backward compat
            
            // --- Musical Pitch System ---
            pitchSemi: 0,        // -24 to +24 semitones
            pitchFine: 0,        // -100 to +100 cents
            pitchSnap: true,     // Quantize coarse to semitones
            scaleRoot: 0,        // 0-11 (C=0, C#=1, ... B=11)
            scaleType: 'chromatic', // Scale ID
            chordType: 'unison', // Chord ID
            chordSpread: 0,      // 0-3 octaves
            chordInversion: 0,   // 0-3
            voiceMode: 'random', // 'cycle', 'random', 'weighted'
            
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
            
            // --- Sampler Engine Params ---
            sampler: {
                start: 0.0,        // 0–1 normalized start point
                end: 1.0,          // 0–1 normalized end point (< start = reverse)
                pitchSemi: 0,      // -24 to +24 semitones
                pitchFine: 0,      // -50 to +50 cents
                lpf: 20000,        // Low-pass filter cutoff Hz
                hpf: 20,           // High-pass filter cutoff Hz
                volume: 0.8,       // 0–1.5
                loopMode: 'off',   // 'off', 'forward', 'pingpong'
                attack: 0.005,     // seconds
                decay: 0.1,        // seconds
                sustain: 0.8,      // 0–1
                release: 0.1,      // seconds
                voices: 4,         // 1–8 simultaneous voices
            },
            
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