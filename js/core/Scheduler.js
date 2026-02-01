// Scheduler Module - Phase 4: AudioWorklet Sequencer Controller (FULL VERSION)

import { NUM_STEPS } from '../utils/constants.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        this.isPlaying = false;
        this.bpm = 120;
        
        // UI Callbacks
        this.updateMatrixHeadCallback = null;
        this.randomChokeCallback = null;
        
        this.trackManager = null; 
        this.activeSnapshot = null; 
        this.tracks = [];

        // Listen for Step Updates from AudioWorklet
        window.addEventListener('sequencer:step', (e) => {
            if (this.isPlaying && this.updateMatrixHeadCallback) {
                this.updateMatrixHeadCallback(e.detail.step, e.detail.step);
            }
        });

        // Listen for External Triggers (909 / Automation)
        window.addEventListener('sequencer:trigger', (e) => {
            if (!this.isPlaying) return;
            const { trackId, velocity, time } = e.detail;
            const track = this.tracks.find(t => t.id === trackId);
            
            if (track) {
                if (track.type === 'simple-drum') {
                    // Trigger 909 Engine immediately
                    this.audioEngine.triggerDrum(track, this.audioEngine.getContext().currentTime, velocity);
                } 
                else if (track.type === 'automation') {
                    // Handle automation logic
                    this.processAutomationTrack(track, velocity);
                }
            }
        });
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setBPM(bpm) {
        this.bpm = Math.max(30, Math.min(300, parseInt(bpm)));
        if (this.granularSynth) {
            this.granularSynth.setBPM(this.bpm);
        }
    }

    getBPM() {
        return this.bpm;
    }

    setUpdateMatrixHeadCallback(callback) {
        this.updateMatrixHeadCallback = callback;
    }

    setRandomChokeCallback(callback) {
        this.randomChokeCallback = callback;
    }

    start(scheduleVisualDrawCallback) {
        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx) return;
        
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.activeSnapshot = null;
            
            // Sync all patterns before starting
            this.syncAllTracksToWorklet();
            
            // Send Start Command
            this.granularSynth.startTransport();
        }
    }

    stop() {
        this.isPlaying = false;
        this.granularSynth.stopTransport();
        
        if(this.activeSnapshot && this.trackManager) {
            this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
            this.activeSnapshot = null;
        }
        
        this.tracks.forEach(t => {
            if(t.stopAllSources) t.stopAllSources();
        });
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    // --- Pattern Synchronization ---

    updateTrack(track) {
        if (!this.granularSynth) return;
        this.granularSynth.updateTrackPattern(
            track.id,
            track.steps,
            track.microtiming
        );
    }

    syncAllTracksToWorklet() {
        this.tracks.forEach(track => {
            this.updateTrack(track);
        });
    }

    // --- Automation Handling ---

    processAutomationTrack(track, velocity) {
        if (!this.trackManager) return;
        if (velocity > 0) {
            if (!this.activeSnapshot) {
                this.activeSnapshot = this.trackManager.saveGlobalSnapshot();
            }
            this.trackManager.triggerRandomization(velocity);
        } 
    }
}