// Scheduler Module - Optimized with EventBus
import { LOOKAHEAD, SCHEDULE_AHEAD_TIME, NUM_STEPS } from '../utils/constants.js';
import { globalBus } from '../events/EventBus.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.totalStepsPlayed = 0; 
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
            this.totalStepsPlayed = 0; 
            this.nextNoteTime = audioCtx.currentTime + 0.1;
            
            this.activeSnapshot = null;
            this.tracks.forEach(t => { if(t.type === 'automation') t.lastAutoValue = 0; });

            // OPTIMIZATION: Emit start event to wake up visualizers
            globalBus.emit('playback:start');

            this.schedule(scheduleVisualDrawCallback);
        }
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimerID);
        if(this.activeSnapshot && this.trackManager) {
            this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
            this.activeSnapshot = null;
        }
        this.tracks.forEach(t => {
            if(t.stopAllSources) t.stopAllSources();
        });

        // OPTIMIZATION: Emit stop event to put visualizers to sleep
        globalBus.emit('playback:stop');
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
        this.totalStepsPlayed++; 
    }

    scheduleStep(step, time, scheduleVisualDrawCallback) {
        const currentTotal = this.totalStepsPlayed;

        if (this.updateMatrixHeadCallback) {
            requestAnimationFrame(() => this.updateMatrixHeadCallback(step, currentTotal));
        }
        
        this.tracks.forEach(t => {
            if (t.type === 'automation' && !t.muted) {
                this.processAutomationTrack(t, currentTotal, time);
            }
        });

        const randomChokeInfo = this.randomChokeCallback ? this.randomChokeCallback() : { mode: false, groups: [] };
        
        if (randomChokeInfo.mode) {
            const chokeGroupMap = new Map();
            const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
            
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 
                // V2: Velocity Check > 0
                if (t.steps[step] === 0) continue;
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
                    this.triggerTrack(this.tracks[winnerId], time, scheduleVisualDrawCallback, step);
                }
            });
        } else {
            const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 

                // V2: Velocity Check > 0
                if (t.steps[step] === 0) continue;
                
                if (isAnySolo) {
                    if (t.soloed) this.triggerTrack(t, time, scheduleVisualDrawCallback, step);
                } else {
                    if (!t.muted) this.triggerTrack(t, time, scheduleVisualDrawCallback, step);
                }
            }
        }
    }

    triggerTrack(track, time, scheduleVisualDrawCallback, stepIndex) {
        if (track.chokeGroup > 0) {
            this.tracks.forEach(other => {
                if (other.id !== track.id && other.chokeGroup === track.chokeGroup) {
                    other.stopAllSources(time);
                }
            });
        }

        // V2: Get Velocity & Microtiming
        const velocity = track.steps[stepIndex];
        const microtimingMs = track.microtiming[stepIndex] || 0;
        
        // Convert ms to seconds (e.g., -5ms = -0.005s)
        const offsetSeconds = microtimingMs / 1000.0;
        
        let actualTime = time + offsetSeconds;
        
        // Clamp time to now if offset makes it in the past (only if negative offset > lookahead)
        const audioCtx = this.audioEngine.getContext();
        if (audioCtx && actualTime < audioCtx.currentTime) {
            actualTime = audioCtx.currentTime;
        }

        this.granularSynth.scheduleNote(track, actualTime, scheduleVisualDrawCallback, velocity);
    }

    processAutomationTrack(track, totalSteps, time) {
        if (!this.trackManager) return;

        const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
        const effectiveStepIndex = Math.floor(totalSteps / track.clockDivider) % trackLength;
        const currentValue = track.steps[effectiveStepIndex];
        const prevValue = track.lastAutoValue;

        if (currentValue !== prevValue) {
            if (prevValue === 0 && currentValue > 0) {
                if (!this.activeSnapshot) {
                    this.activeSnapshot = this.trackManager.saveGlobalSnapshot();
                }
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue > 0) {
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue === 0) {
                if (this.activeSnapshot) {
                    this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
                    this.activeSnapshot = null;
                }
            }
            track.lastAutoValue = currentValue;
        }
    }
}