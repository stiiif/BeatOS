// Scheduler Module
import { LOOKAHEAD, SCHEDULE_AHEAD_TIME, NUM_STEPS } from '../utils/constants.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.nextNoteTime = 0.0;
        this.schedulerTimerID = null;
        this.tracks = [];
        this.updateMatrixHeadCallback = null;
        this.randomChokeCallback = null;
        
        this.trackManager = null; 
        this.activeSnapshot = null; 
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setBPM(bpm) {
        this.bpm = Math.max(30, Math.min(300, parseInt(bpm)));
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
            this.currentStep = 0;
            this.nextNoteTime = audioCtx.currentTime + 0.1;
            
            // Reset automation state on start
            this.activeSnapshot = null;
            this.tracks.forEach(t => { if(t.type === 'automation') t.lastAutoValue = 0; });

            this.schedule(scheduleVisualDrawCallback);
        }
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimerID);
        // Restore snapshot if stopping mid-automation
        if(this.activeSnapshot && this.trackManager) {
            this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
            this.activeSnapshot = null;
        }
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    getCurrentStep() {
        return this.currentStep;
    }

    schedule(scheduleVisualDrawCallback) {
        const audioCtx = this.audioEngine.getContext();
        while (this.nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
            this.scheduleStep(this.currentStep, this.nextNoteTime, scheduleVisualDrawCallback);
            this.nextNextTime();
        }
        this.schedulerTimerID = window.setTimeout(() => this.schedule(scheduleVisualDrawCallback), LOOKAHEAD);
    }

    nextNextTime() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat / 4;
        this.currentStep = (this.currentStep + 1) % NUM_STEPS;
    }

    scheduleStep(step, time, scheduleVisualDrawCallback) {
        if (this.updateMatrixHeadCallback) {
            requestAnimationFrame(() => this.updateMatrixHeadCallback(step));
        }
        
        // --- AUTOMATION TRACK LOGIC ---
        // Process automation BEFORE scheduling notes to ensure params are updated
        this.tracks.forEach(t => {
            if (t.type === 'automation' && !t.muted) {
                this.processAutomationTrack(t, step, time);
            }
        });

        // --- AUDIO TRIGGER LOGIC ---
        // Get random choke info if available
        const randomChokeInfo = this.randomChokeCallback ? this.randomChokeCallback() : { mode: false, groups: [] };
        
        if (randomChokeInfo.mode) {
            // Random choke mode
            const chokeGroupMap = new Map();
            const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
            
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 
                
                if (!t.steps[step]) continue;
                
                if (isAnySolo && !t.soloed) continue;
                if (!isAnySolo && t.muted) continue;
                
                const randomGroup = randomChokeInfo.groups[i];
                if (!chokeGroupMap.has(randomGroup)) {
                    chokeGroupMap.set(randomGroup, []);
                }
                chokeGroupMap.get(randomGroup).push(i);
            }
            
            chokeGroupMap.forEach((trackIds) => {
                if (trackIds.length > 0) {
                    const winnerIdx = Math.floor(Math.random() * trackIds.length);
                    const winnerId = trackIds[winnerIdx];
                    this.granularSynth.scheduleNote(this.tracks[winnerId], time, scheduleVisualDrawCallback);
                }
            });
        } else {
            // Normal mode
            const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 

                if (!t.steps[step]) continue; // steps is array of booleans/values. For audio it acts truthy if true.
                
                if (isAnySolo) {
                    if (t.soloed) this.granularSynth.scheduleNote(t, time, scheduleVisualDrawCallback);
                } else {
                    if (!t.muted) this.granularSynth.scheduleNote(t, time, scheduleVisualDrawCallback);
                }
            }
        }
    }

    processAutomationTrack(track, globalStep, time) {
        if (!this.trackManager) return;

        // Clock Division Logic
        const effectiveStepIndex = Math.floor(globalStep / track.clockDivider) % NUM_STEPS;
        
        // Get step value (0-5)
        const currentValue = track.steps[effectiveStepIndex];
        const prevValue = track.lastAutoValue;

        if (currentValue !== prevValue) {
            // CASE: Turning ON (0 -> Value)
            if (prevValue === 0 && currentValue > 0) {
                // Save Snapshot if not already active
                if (!this.activeSnapshot) {
                    this.activeSnapshot = this.trackManager.saveGlobalSnapshot();
                }
                this.trackManager.triggerRandomization(currentValue);
            }
            // CASE: Changing Value (Value -> Value)
            else if (prevValue > 0 && currentValue > 0) {
                // Just randomize again, don't update snapshot
                this.trackManager.triggerRandomization(currentValue);
            }
            // CASE: Turning OFF (Value -> 0)
            else if (prevValue > 0 && currentValue === 0) {
                // Restore Snapshot
                if (this.activeSnapshot) {
                    this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
                    this.activeSnapshot = null;
                }
            }

            track.lastAutoValue = currentValue;
        }
    }
}