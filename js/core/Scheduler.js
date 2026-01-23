// Scheduler Module
import { LOOKAHEAD, SCHEDULE_AHEAD_TIME, NUM_STEPS } from '../utils/constants.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.totalStepsPlayed = 0; // NEW: Absolute step counter
        this.nextNoteTime = 0.0;
        this.schedulerTimerID = null;
        this.tracks = [];
        this.updateMatrixHeadCallback = null;
        this.randomChokeCallback = null;
        
        this.trackManager = null; 
        this.activeSnapshot = null; 

        // DEBUG: Verify imported constant
        console.log(`[Scheduler] Initialized. NUM_STEPS constant is: ${NUM_STEPS}`);
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
            this.totalStepsPlayed = 0; // Reset absolute counter
            this.nextNoteTime = audioCtx.currentTime + 0.1;
            
            // Reset automation state on start
            this.activeSnapshot = null;
            this.tracks.forEach(t => { if(t.type === 'automation') t.lastAutoValue = 0; });

            console.log("[Scheduler] Started playback.");
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
        
        // Stop all sound on stop
        this.tracks.forEach(t => {
            if(t.stopAllSources) t.stopAllSources();
        });
        
        console.log("[Scheduler] Stopped playback.");
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
        this.totalStepsPlayed++; // Increment absolute counter
    }

    scheduleStep(step, time, scheduleVisualDrawCallback) {
        // Capture totalStepsPlayed locally to avoid race conditions in async callback
        const currentTotal = this.totalStepsPlayed;

        if (this.updateMatrixHeadCallback) {
            requestAnimationFrame(() => this.updateMatrixHeadCallback(step, currentTotal));
        }
        
        // --- AUTOMATION TRACK LOGIC ---
        // Pass absolute totalStepsPlayed for calculation
        this.tracks.forEach(t => {
            if (t.type === 'automation' && !t.muted) {
                this.processAutomationTrack(t, currentTotal, time);
            }
        });

        // --- AUDIO TRIGGER LOGIC ---
        // (Audio tracks still use the looped 'step' 0-63)
        const randomChokeInfo = this.randomChokeCallback ? this.randomChokeCallback() : { mode: false, groups: [] };
        
        if (randomChokeInfo.mode) {
            // Random Choke Mode
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
                    this.triggerTrack(this.tracks[winnerId], time, scheduleVisualDrawCallback);
                }
            });
        } else {
            // Normal mode
            const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (t.type === 'automation') continue; 

                if (!t.steps[step]) continue;
                
                if (isAnySolo) {
                    if (t.soloed) this.triggerTrack(t, time, scheduleVisualDrawCallback);
                } else {
                    if (!t.muted) this.triggerTrack(t, time, scheduleVisualDrawCallback);
                }
            }
        }
    }

    triggerTrack(track, time, scheduleVisualDrawCallback) {
        if (track.chokeGroup > 0) {
            this.tracks.forEach(other => {
                if (other.id !== track.id && other.chokeGroup === track.chokeGroup) {
                    other.stopAllSources(time);
                }
            });
        }
        this.granularSynth.scheduleNote(track, time, scheduleVisualDrawCallback);
    }

    processAutomationTrack(track, totalSteps, time) {
        if (!this.trackManager) return;

        // Use track.steps.length instead of NUM_STEPS constant to ensure it matches the actual track size
        const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
        
        // Use absolute totalSteps divided by clockDivider
        // Formula: Index = floor(Total / Divider) % Length
        const effectiveStepIndex = Math.floor(totalSteps / track.clockDivider) % trackLength;
        
        // --- DEBUG LOGGING ---
        // Only log when effective step changes to reduce spam, or if it wraps
        const prevEffectiveStep = Math.floor((totalSteps - 1) / track.clockDivider) % trackLength;
        
        if (effectiveStepIndex !== prevEffectiveStep || totalSteps === 0) {
            console.log(`[AutoTrack #${track.id}] Update:`, {
                totalSteps: totalSteps,
                clockDivider: track.clockDivider,
                trackLength: trackLength,
                calc: `Math.floor(${totalSteps} / ${track.clockDivider}) % ${trackLength}`,
                effectiveIndex: effectiveStepIndex,
                wrapsAt: trackLength * track.clockDivider
            });
        }
        // ---------------------

        const currentValue = track.steps[effectiveStepIndex];
        const prevValue = track.lastAutoValue;

        if (currentValue !== prevValue) {
            console.log(`[AutoTrack #${track.id}] CHANGE DETECTED: ${prevValue} -> ${currentValue}`);

            if (prevValue === 0 && currentValue > 0) {
                console.log(`   -> SNAPSHOT & RANDOMIZE (Level ${currentValue})`);
                if (!this.activeSnapshot) {
                    this.activeSnapshot = this.trackManager.saveGlobalSnapshot();
                }
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue > 0) {
                console.log(`   -> RE-RANDOMIZE (Level ${currentValue})`);
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue === 0) {
                console.log(`   -> RESTORE SNAPSHOT`);
                if (this.activeSnapshot) {
                    this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
                    this.activeSnapshot = null;
                }
            }
            track.lastAutoValue = currentValue;
        }
    }
}