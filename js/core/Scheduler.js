/**
 * Scheduler.js
 * Handles the master clock and event scheduling.
 * Fixed: Added proper time passing to the trigger engine and corrected fallback methods.
 */

import { EventBus } from '../events/EventBus.js';
import { EVENTS } from '../utils/constants.js'; 

class Scheduler {
    constructor(audioContext, trackManager) {
        this.ctx = audioContext;
        this.trackManager = trackManager;
        
        // Timing settings
        this.bpm = 120;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // seconds
        this.nextNoteTime = 0.0;
        this.currentStep = 0;
        this.stepsPerPattern = 64; 
        
        this.isRunning = false;
        this.timerID = null;

        // Jitter Control
        this.jitterAmount = 0.0; 

        // Callbacks
        this.onStepCallback = null;
        this.onRandomChokeCallback = null;
    }

    setTrackManager(trackManager) {
        this.trackManager = trackManager;
    }

    setTracks(trackManager) {
        this.trackManager = trackManager;
    }

    setUpdateMatrixHeadCallback(callback) {
        this.onStepCallback = callback;
    }

    setRandomChokeCallback(callback) {
        this.onRandomChokeCallback = callback;
    }

    setTempo(bpm) {
        this.bpm = bpm;
    }

    setBpm(bpm) {
        this.setTempo(bpm);
    }

    setBPM(bpm) {
        this.setTempo(bpm);
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    getIsPlaying() {
        return this.isRunning;
    }

    reset() {
        this.currentStep = 0;
        if (this.onStepCallback) {
            this.onStepCallback(0);
        }
    }

    _gaussianRandom(mean = 0, stdev = 1) {
        const u = 1 - Math.random(); 
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        return z * stdev + mean;
    }

    start() {
        if (this.isRunning) return;
        
        // Ensure AudioContext is resumed (browser safety)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isRunning = true;
        this.currentStep = 0;
        // Start slightly in the future to allow initial lookahead
        this.nextNoteTime = this.ctx.currentTime + 0.05; 
        
        this.tick();
        EventBus.emit(EVENTS.PLAYBACK_START);
    }

    stop() {
        this.isRunning = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        
        // Stop all active track sources immediately
        if (this.trackManager) {
            this.trackManager.getTracks().forEach(track => {
                if (track.stopAllSources) track.stopAllSources();
            });
        }

        EventBus.emit(EVENTS.PLAYBACK_STOP);
    }

    tick() {
        if (!this.isRunning) return;

        // Schedule all notes within the lookahead window
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.advanceStep();
        }

        this.timerID = setTimeout(() => this.tick(), this.lookahead);
    }

    advanceStep() {
        const secondsPerBeat = 60.0 / this.bpm;
        // 16th note duration = 0.25 of a beat
        this.nextNoteTime += 0.25 * secondsPerBeat;
        
        this.currentStep++;
        if (this.currentStep >= this.stepsPerPattern) {
            this.currentStep = 0;
        }
    }

    scheduleStep(stepNumber, time) {
        requestAnimationFrame(() => {
            EventBus.emit(EVENTS.PLAYBACK_STEP, stepNumber);
            if (this.onStepCallback) {
                this.onStepCallback(stepNumber);
            }
        });

        if (!this.trackManager) return;
        const tracks = this.trackManager.getTracks();
        
        tracks.forEach(track => {
            // Respect Mute and Solo states
            if (track.muted) return;
            
            // If any track is soloed, only play soloed tracks
            const anySoloed = tracks.some(t => t.soloed);
            if (anySoloed && !track.soloed) return;

            const patternValue = track.steps[stepNumber];
            
            // Check if step is active (V2 uses 0 for off, 1-3 for velocities)
            if (patternValue > 0) {
                let preciseTime = time;
                
                // Apply Humanization/Jitter
                if (this.jitterAmount > 0) {
                    const maxDrift = 0.04 * this.jitterAmount; // Max 40ms drift
                    const drift = this._gaussianRandom() * maxDrift;
                    preciseTime = Math.max(this.ctx.currentTime, preciseTime + drift);
                }
                
                // Use the new granular synth trigger logic
                if (track.granularSynth) {
                    const params = {
                        position: track.params.position,
                        pitch: track.params.pitch,
                        density: track.params.density,
                        spray: track.params.spray,
                        volume: track.params.volume * (patternValue / 3) // Scale by velocity
                    };
                    
                    // Critical: Pass time as first argument
                    track.granularSynth.trigger(preciseTime, params);
                } else if (this.trackManager.audioEngine) {
                    // Fallback to triggerDrum (corrected from triggerTrack)
                    this.trackManager.audioEngine.triggerDrum(track, preciseTime, patternValue);
                }
            }
        });
        
        if (this.onRandomChokeCallback) {
            this.onRandomChokeCallback(stepNumber, time);
        }
    }
}

export { Scheduler };