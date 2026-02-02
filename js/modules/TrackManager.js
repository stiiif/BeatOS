// Track Manager Module - Updated for Shared Memory Architecture (Phase B)
import { Track } from './Track.js';
import { START_TRACKS, MAX_TRACKS, NUM_LFOS, TRACKS_PER_GROUP, AUTOMATION_INTENSITIES } from '../utils/constants.js';
import { MEMORY_LAYOUT } from '../core/SharedMemory.js';

export class TrackManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.tracks = [];
    }

    getTracks() {
        return this.tracks;
    }

    initTracks() {
        for (let i = 0; i < START_TRACKS; i++) {
            this.addTrack(true);
        }
        this.applyDefaultPresets();
    }

    addTrack(silent = false) {
        if (this.tracks.length >= MAX_TRACKS) return null;
        const newId = this.tracks.length;
        const t = new Track(newId);
        this.tracks.push(t);
        
        // Generate buffer & routing
        const audioCtx = this.audioEngine.getContext();
        if (audioCtx) {
            // V5: We don't initialize a complex per-track bus on main thread anymore.
            // But we might need buffers for Granular/Sample engines.
            t.buffer = this.audioEngine.generateBufferForTrack(newId);
            t.rmsMap = this.audioEngine.analyzeBuffer(t.buffer);
            
            // Note: In V5, routing is static (32 outs from worklet). 
            // We just ensure the buffer is loaded into the worklet.
            // This happens lazily or explicitly via GranularSynthWorklet wrapper.
        }

        return silent ? null : newId;
    }

    applyDefaultPresets() {
        // Apply initial params to both local object (for UI) and Shared Memory (for Audio)
        if(this.tracks[0]) this.setParam(0, 'density', 1);
        if(this.tracks[1]) this.setParam(1, 'position', 0.5);
        
        // Randomize others for variety
        for(let i=3; i<this.tracks.length; i++) {
             this.setParam(i, 'position', Math.random());
             this.setParam(i, 'density', 2 + Math.floor(Math.random() * 20));
             this.setParam(i, 'pitch', 0.5 + Math.random() * 1.5);
        }
    }

    createBuffersForAllTracks() {
        // V5: Delegate to AudioEngine utils
        for(let i=0; i<this.tracks.length; i++) {
            this.tracks[i].buffer = this.audioEngine.generateBufferForTrack(i);
            this.tracks[i].rmsMap = this.audioEngine.analyzeBuffer(this.tracks[i].buffer);
            
            // Important: We must notify the wrapper to upload this buffer to the Worklet
            // We assume main.js or GranularSynth wrapper handles the upload call 'ensureBufferLoaded'
        }
    }

    // --- SHARED MEMORY PARAMETER UPDATES ---
    
    setParam(trackId, paramName, value) {
        const track = this.tracks[trackId];
        if (!track) return;

        // 1. Update Local State (for UI reflection)
        track.params[paramName] = value;

        // 2. Map to Shared Memory Index
        let paramIndex = -1;
        switch(paramName) {
            case 'volume': paramIndex = MEMORY_LAYOUT.P_VOL; break;
            case 'pan': paramIndex = MEMORY_LAYOUT.P_PAN; break;
            case 'pitch': paramIndex = MEMORY_LAYOUT.P_PITCH; break;
            case 'grainSize': 
            case 'drumDecay': paramIndex = MEMORY_LAYOUT.P_DECAY; break;
            case 'position': 
            case 'drumTune': paramIndex = MEMORY_LAYOUT.P_POSITION; break;
            case 'density': 
            case 'snap': paramIndex = MEMORY_LAYOUT.P_DENSITY; break;
            case 'spray': paramIndex = MEMORY_LAYOUT.P_SPRAY; break;
            case 'filter': paramIndex = MEMORY_LAYOUT.P_FILTER; break;
            case 'drive': paramIndex = MEMORY_LAYOUT.P_DRIVE; break;
            case 'sendA': paramIndex = MEMORY_LAYOUT.P_SEND_A; break;
            case 'sendB': paramIndex = MEMORY_LAYOUT.P_SEND_B; break;
            // Type is usually set via specific method, but handled here too
            case 'type': paramIndex = MEMORY_LAYOUT.P_TYPE; break; 
        }

        // 3. Write to Shared Memory
        if (paramIndex !== -1) {
            this.audioEngine.updateParam(trackId, paramIndex, value);
        }
    }
    
    // --- UTILS ---

    randomizeTrackParams(t, releaseMin = null, releaseMax = null) {
        this.setParam(t.id, 'position', Math.random());
        this.setParam(t.id, 'spray', Math.random() * 0.1);
        this.setParam(t.id, 'grainSize', 0.05 + Math.random() * 0.25);
        this.setParam(t.id, 'filter', 2000 + Math.random() * 10000);
        this.setParam(t.id, 'pitch', 0.5 + Math.random() * 1.5);
        
        // Legacy: 'relGrain' mapped to Duration/Decay in new system?
        // For now, we ignore 'relGrain' or map it if needed.
    }

    randomizeTrackModulators(t) {
        // V5 TODO: Implement LFOs writing to ParamBuffer reserved slots
        // For now, keep local object updates, will connect in Phase C
        const targets = ['none', 'position', 'spray', 'density', 'grainSize', 'pitch', 'filter'];
        const waves = ['sine', 'square', 'sawtooth', 'random'];
        
        t.lfos.forEach(lfo => {
            if(Math.random() < 0.7) {
                lfo.target = targets[Math.floor(Math.random() * (targets.length - 1)) + 1]; 
                lfo.amount = parseFloat((0.1 + Math.random() * 0.9).toFixed(2)); 
            } else { lfo.target = 'none'; lfo.amount = 0; }
            lfo.wave = waves[Math.floor(Math.random() * waves.length)];
            lfo.rate = parseFloat((0.1 + Math.random() * 19.9).toFixed(1));
        });
    }

    randomizePanning() {
        const numGroups = 8;
        for (let i = 0; i < this.tracks.length; i++) {
            const groupIdx = Math.floor(i / TRACKS_PER_GROUP); 
            const groupCenter = -1 + (groupIdx / (numGroups - 1)) * 2;
            const variation = (Math.random() - 0.5) * 0.2;
            const pan = Math.max(-1, Math.min(1, groupCenter + variation));
            
            this.setParam(i, 'pan', parseFloat(pan.toFixed(3)));
        }
    }

    // --- AUTOMATION FEATURES ---

    saveGlobalSnapshot() {
        return this.tracks.map(t => ({
            params: {...t.params},
            lfos: t.lfos.map(l => ({...l}))
        }));
    }

    restoreGlobalSnapshot(snapshotData) {
        if (!snapshotData) return;
        snapshotData.forEach((data, i) => {
            if (this.tracks[i]) {
                const t = this.tracks[i];
                if (t.ignoreRandom) return;

                // Bulk restore params via setter to ensure Memory sync
                for (const [key, val] of Object.entries(data.params)) {
                    this.setParam(i, key, val);
                }
                
                // Restore LFOs (local for now)
                t.lfos.forEach((lfo, idx) => {
                    if (data.lfos[idx]) Object.assign(lfo, data.lfos[idx]);
                });
            }
        });
    }

    triggerRandomization(intensityLevel) {
        const zone = AUTOMATION_INTENSITIES[intensityLevel];
        if (!zone) return;

        this.tracks.forEach(t => {
            if (t.type === 'automation' || t.ignoreRandom) return;

            if (t.type === 'granular') {
                this.randomizeTrackParams(t, zone.min, zone.max);
                this.randomizeTrackModulators(t);
            } else if (t.type === 'simple-drum') {
                this.setParam(t.id, 'drumTune', Math.random());
                this.setParam(t.id, 'drumDecay', Math.random());
            }
        });
    }

    // --- INSTRUMENT AUTO-CONFIGURATION ---
    autoConfigureTrack(track, instrumentName) {
        if (track.stepLock || track.type === 'automation') return;

        const name = instrumentName.toLowerCase();
        let targetType = 'granular'; // 0
        let typeCode = 0;
        let params = { ...track.params };
        let bufferType = 'texture';

        // Map names to Types & Params
        if (name.includes('kick') || name === 'bass_drum') {
            targetType = 'simple-drum'; typeCode = 1; // Kick
            params.drumTune = 0.3; params.drumDecay = 0.6; params.filter = 5000;
        } else if (name.includes('snare')) {
            targetType = 'simple-drum'; typeCode = 2; // Snare
            params.drumTune = 0.6; params.drumDecay = 0.4; params.filter = 12000;
        } else if (name.includes('hat') || name.includes('shaker')) {
            targetType = 'simple-drum'; typeCode = 3; // Hat
            params.drumTune = 0.7; params.drumDecay = 0.3; params.filter = 20000;
        } else {
            // Default Granular
            targetType = 'granular'; typeCode = 0;
            params.position = Math.random(); 
            params.grainSize = 0.05; params.density = 20;
        }

        // Apply Configuration
        track.type = targetType;
        
        // Sync Type to Shared Memory
        this.setParam(track.id, 'type', typeCode);
        
        // Apply all other params
        for (const [key, val] of Object.entries(params)) {
            this.setParam(track.id, key, val);
        }
        
        if (!track.customSample) { 
            track.autoName = instrumentName; 
        }

        // Buffer handling remains managed by main thread loader
        if (targetType === 'granular' && this.audioEngine) {
            track.buffer = this.audioEngine.generateBufferByType(bufferType);
            track.rmsMap = this.audioEngine.analyzeBuffer(track.buffer);
            // NOTE: Wrapper must upload this buffer
        }
    }
}