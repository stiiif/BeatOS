// Track Manager Module
import { Track } from './Track.js';
import { START_TRACKS, MAX_TRACKS, NUM_LFOS, TRACKS_PER_GROUP, AUTOMATION_INTENSITIES } from '../utils/constants.js';

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
        
        // Generate buffer
        const audioCtx = this.audioEngine.getContext();
        if (audioCtx) {
            t.buffer = this.audioEngine.generateBufferForTrack(newId);
            t.rmsMap = this.audioEngine.analyzeBuffer(t.buffer);
            this.audioEngine.initTrackBus(t);
        }

        return silent ? null : newId;
    }

    applyDefaultPresets() {
        if(this.tracks[0]) this.tracks[0].params = { ...this.tracks[0].params, density: 1, grainSize: 0.3, pitch: 1.0, relGrain: 0.3, filter: 200, hpFilter: 20 };
        if(this.tracks[1]) this.tracks[1].params = { ...this.tracks[1].params, density: 4, position: 0.5, filter: 4000, hpFilter: 100 };
        if(this.tracks[2]) this.tracks[2].params = { ...this.tracks[2].params, density: 40, grainSize: 0.02, pitch: 2.0, filter: 9000, hpFilter: 1000 };
        
        for(let i=3; i<this.tracks.length; i++) {
             this.tracks[i].params.position = Math.random();
             this.tracks[i].params.density = 2 + Math.floor(Math.random() * 20);
             this.tracks[i].params.grainSize = 0.05 + Math.random() * 0.2;
             this.tracks[i].params.pitch = 0.5 + Math.random() * 1.5;
        }
    }

    createBuffersForAllTracks() {
        for(let i=0; i<this.tracks.length; i++) {
            this.tracks[i].buffer = this.audioEngine.generateBufferForTrack(i);
            this.tracks[i].rmsMap = this.audioEngine.analyzeBuffer(this.tracks[i].buffer);
            this.audioEngine.initTrackBus(this.tracks[i]);
        }
    }

    randomizeTrackParams(t, releaseMin = null, releaseMax = null) {
        t.params.position = Math.random();
        t.params.spray = Math.random() * 0.1;
        t.params.grainSize = 0.05 + Math.random() * 0.25;
        t.params.filter = 2000 + Math.random() * 10000;
        t.params.hpFilter = 20 + Math.random() * 500;
        t.params.pitch = 0.5 + Math.random() * 1.5;
        
        if (releaseMin !== null && releaseMax !== null) {
            t.params.relGrain = releaseMin + Math.random() * (releaseMax - releaseMin);
        } else {
            t.params.relGrain = 0.05 + Math.random() * 0.5;
        }
    }

    randomizeTrackModulators(t) {
        const targets = ['none', 'position', 'spray', 'density', 'grainSize', 'pitch', 'filter', 'hpFilter'];
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
            this.tracks[i].params.pan = parseFloat(pan.toFixed(3));
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
                // Check if track is excluded from randomization
                if (t.ignoreRandom) return;

                t.params.position = data.params.position;
                t.params.spray = data.params.spray;
                t.params.grainSize = data.params.grainSize;
                t.params.filter = data.params.filter;
                t.params.hpFilter = data.params.hpFilter;
                t.params.pitch = data.params.pitch;
                t.params.relGrain = data.params.relGrain;
                t.params.drumTune = data.params.drumTune;
                t.params.drumDecay = data.params.drumDecay;
                
                t.lfos.forEach((lfo, idx) => {
                    if (data.lfos[idx]) {
                        lfo.target = data.lfos[idx].target;
                        lfo.amount = data.lfos[idx].amount;
                        lfo.rate = data.lfos[idx].rate;
                        lfo.wave = data.lfos[idx].wave;
                    }
                });
            }
        });
    }

    triggerRandomization(intensityLevel) {
        const zone = AUTOMATION_INTENSITIES[intensityLevel];
        if (!zone) return;

        this.tracks.forEach(t => {
            if (t.type === 'automation') return; 
            
            // Protect track if "Exclude Random" is enabled
            if (t.ignoreRandom) return;

            if (t.type === 'granular') {
                this.randomizeTrackParams(t, zone.min, zone.max);
                this.randomizeTrackModulators(t);
            } else if (t.type === 'simple-drum') {
                t.params.drumTune = Math.random();
                t.params.drumDecay = Math.random();
            }
        });
    }

    // --- INSTRUMENT AUTO-CONFIGURATION (GROOVE GEN) ---
    autoConfigureTrack(track, instrumentName) {
        if (track.stepLock || track.type === 'automation') return; // Safety check

        const name = instrumentName.toLowerCase();
        let targetType = 'granular';
        let params = { ...track.params };
        let bufferType = 'texture';

        // Heuristic Mapping - ORDER MATTERS!
        // Specific checks first, generic checks last.

        if (name.includes('kick') || name.includes('surdo') || name.includes('bombo') || 
            name.includes('tambora') || name.includes('manman') || name.includes('boula') || 
            name.includes('barril') || name.includes('atumpan') || name === 'bass_drum') {
            
            targetType = 'simple-drum';
            params.drumType = 'kick';
            params.drumTune = 0.3; // Lower pitch
            params.drumDecay = 0.6; // Longer decay
            params.filter = 5000;
            params.hpFilter = 20;

        } else if (name.includes('snare') || name.includes('caixa') || name.includes('repinique') || 
                   name.includes('kidi') || name.includes('sabar') || name.includes('djembe') || 
                   name.includes('conga') || name.includes('bongo') || name.includes('kaganu') || name === 'snare_drum') {
            
            targetType = 'simple-drum';
            params.drumType = 'snare';
            params.drumTune = 0.6;
            params.drumDecay = 0.4;
            params.filter = 12000;
            params.hpFilter = 100;

        } else if (name.includes('hat') || name.includes('shaker') || name.includes('maraca') || 
                   name.includes('ganza') || name.includes('cascabeles') || name.includes('kata') || 
                   name.includes('guiro') || name.includes('shekere') || name.includes('hi_hat')) {
            
            targetType = 'simple-drum';
            // Differentiate open vs closed
            if (name.includes('open')) params.drumType = 'open-hat';
            else params.drumType = 'closed-hat';
            
            params.drumTune = 0.7;
            params.drumDecay = 0.3; 
            params.filter = 20000;
            params.hpFilter = 2000;

        } else if (name.includes('bell') || name.includes('agogo') || name.includes('ogan') || 
                   name.includes('clave') || name.includes('wood') || name.includes('triangle') || 
                   name.includes('gong') || name.includes('chico') || name.includes('cowbell')) {
            
            // Use Granular engine with FM texture buffer
            targetType = 'granular';
            bufferType = 'texture'; 
            params.position = Math.random(); // Random FM spot
            params.spray = 0;
            params.grainSize = 0.05; // Perussive
            params.density = 20;
            params.pitch = 2.0; // Higher pitch
            params.relGrain = 0.3;
            params.ampAttack = 0.001;
            params.ampDecay = 0.15;
            params.ampRelease = 0.1;
            params.filter = 15000;
            params.hpFilter = 500;

        } else if (name.includes('guitar') || name.includes('cuatro') || name.includes('charango') || 
                   name.includes('harp') || name.includes('piano') || name.includes('kora') || 
                   name.includes('ngoma') || name.includes('synth') || name.includes('bass')) {
            
            // Melodic texture
            targetType = 'granular';
            bufferType = 'texture';
            params.position = Math.random();
            params.spray = 0.02;
            params.grainSize = 0.15; // Longer grains
            params.density = 10;
            params.pitch = 1.0;
            params.relGrain = 0.8;
            params.filter = 10000;
            params.hpFilter = 100;
        } else {
            // Default Fallback (Percussion/Misc)
            // CAUTION: If "kick" or "bass_drum" was not caught above, it lands here.
            // This is likely why "bass_drum" (exact match) loaded cymbal if 'includes' failed or if string was different.
            // But 'bass_drum' includes 'bass', so it might hit the guitar/bass check above if not careful!
            // Wait, 'bass_drum' contains 'bass', so it enters the melodic section if the first 'if' fails.
            // Fix: Ensure 'kick' or 'bass_drum' check is robust.
            
            targetType = 'simple-drum';
            params.drumType = 'cymbal'; // Generic metallic/noise
            params.drumTune = 0.5;
            params.drumDecay = 0.4;
        }

        // Apply Configuration
        track.type = targetType;
        track.params = params;
        
        // Update Name/Label (handled by UI, but we can store it for reference)
        if (!track.customSample) { 
            track.autoName = instrumentName; 
        }

        // Regenerate Buffer if switching back to Granular
        if (targetType === 'granular' && this.audioEngine) {
            track.buffer = this.audioEngine.generateBufferByType(bufferType);
            track.rmsMap = this.audioEngine.analyzeBuffer(track.buffer);
        }
    }
}