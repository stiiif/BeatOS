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
                // Only restore params that get randomized to avoid overwriting volume/pan/mix decisions if not intended
                // But user snapshot restores everything. Logic suggests reverting random changes.
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

            if (t.type === 'granular') {
                this.randomizeTrackParams(t, zone.min, zone.max);
                this.randomizeTrackModulators(t);
            } else if (t.type === 'simple-drum') {
                t.params.drumTune = Math.random();
                t.params.drumDecay = Math.random();
            }
        });
    }
}