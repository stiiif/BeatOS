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

        // B7: Cached solo state — updated on solo toggle, avoids .some() per step
        this._isAnySolo = false;

        // Song mode bar boundary callback
        this._onBarBoundary = null;
        this._onSubdivision = null; // Fires every 2 steps (1/16 note)

        // Config-driven randomizer (optional)
        this.randomizer = null;
        this.randomizerCtx = null;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    // B7: Call this when any track's solo changes
    updateSoloState() {
        this._isAnySolo = false;
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].soloed && this.tracks[i].type !== 'automation') {
                this._isAnySolo = true;
                return;
            }
        }
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setRandomizer(randomizer, ctx) {
        this.randomizer = randomizer;
        this.randomizerCtx = ctx;
    }

    setOnBarBoundary(cb) {
        this._onBarBoundary = cb;
    }

    setOnSubdivision(cb) {
        this._onSubdivision = cb;
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

    /** Reset the step counter to a specific step (for song mode seeking) */
    resetStep(step) {
        this.currentStep = step % NUM_STEPS;
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
        // B7: Refresh solo state once per tick (every 25ms), not per step
        this.updateSoloState();
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

        // Song mode: notify on bar boundary (step 0)
        if (step === 0 && currentTotal > 0 && this._onBarBoundary) {
            this._onBarBoundary();
        }

        // Song mode: subdivision callback (every 2 steps = 1/16 note)
        if (step % 2 === 0 && currentTotal > 0 && this._onSubdivision) {
            this._onSubdivision();
        }

        // B10: Store pending step for render loop to pick up
        this._pendingMatrixStep = step;
        this._pendingMatrixTotal = currentTotal;
        this._pendingMatrixDirty = true;
        
        // B8: for-loop instead of forEach for automation
        for (let i = 0; i < this.tracks.length; i++) {
            const t = this.tracks[i];
            if (t.type === 'automation' && !t.muted) {
                this.processAutomationTrack(t, currentTotal, time);
            }
        }

        const randomChokeInfo = this.randomChokeCallback ? this.randomChokeCallback() : { mode: false, groups: [] };
        
        // B7: Use cached solo state
        const isAnySolo = this._isAnySolo;
        
        if (randomChokeInfo.mode) {
            const chokeGroupMap = new Map();
            
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 
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
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 
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

        const velocity = track.steps[stepIndex];
        const microtimingMs = track.microtiming[stepIndex] || 0;
        const offsetSeconds = microtimingMs / 1000.0;
        let actualTime = time + offsetSeconds;
        
        const audioCtx = this.audioEngine.getContext();
        if (audioCtx && actualTime < audioCtx.currentTime) {
            actualTime = audioCtx.currentTime;
        }

        // Pass stepIndex to allow Step 1 reset check in worklet
        this.granularSynth.scheduleNote(track, actualTime, scheduleVisualDrawCallback, velocity, stepIndex);
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
                this.trackManager.triggerRandomization(currentValue, this.randomizer, this.randomizerCtx);
            }
            else if (prevValue > 0 && currentValue > 0) {
                this.trackManager.triggerRandomization(currentValue, this.randomizer, this.randomizerCtx);
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