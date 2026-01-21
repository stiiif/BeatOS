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
    }

    setTracks(tracks) {
        this.tracks = tracks;
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
            this.schedule(scheduleVisualDrawCallback);
        }
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimerID);
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
        
        // Get random choke info if available
        const randomChokeInfo = this.randomChokeCallback ? this.randomChokeCallback() : { mode: false, groups: [] };
        
        if (randomChokeInfo.mode) {
            // Random choke mode - determine which tracks to play based on random groups
            const chokeGroupMap = new Map();
            const isAnySolo = this.tracks.some(t => t.soloed);
            
            // Group tracks by their random choke group
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (!t.steps[step]) continue;
                
                // Check solo/mute
                if (isAnySolo && !t.soloed) continue;
                if (!isAnySolo && t.muted) continue;
                
                const randomGroup = randomChokeInfo.groups[i];
                if (!chokeGroupMap.has(randomGroup)) {
                    chokeGroupMap.set(randomGroup, []);
                }
                chokeGroupMap.get(randomGroup).push(i);
            }
            
            // For each choke group, randomly pick one track to play
            chokeGroupMap.forEach((trackIds) => {
                if (trackIds.length > 0) {
                    const winnerIdx = Math.floor(Math.random() * trackIds.length);
                    const winnerId = trackIds[winnerIdx];
                    this.granularSynth.scheduleNote(this.tracks[winnerId], time, scheduleVisualDrawCallback);
                }
            });
        } else {
            // Normal mode
            const isAnySolo = this.tracks.some(t => t.soloed);
            for (let i = 0; i < this.tracks.length; i++) {
                const t = this.tracks[i];
                if (!t.steps[step]) continue;
                if (isAnySolo) {
                    if (t.soloed) this.granularSynth.scheduleNote(t, time, scheduleVisualDrawCallback);
                } else {
                    if (!t.muted) this.granularSynth.scheduleNote(t, time, scheduleVisualDrawCallback);
                }
            }
        }
    }
}
