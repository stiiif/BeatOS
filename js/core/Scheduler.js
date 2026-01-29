import { EventBus } from '../events/EventBus.js';

export class Scheduler {
    constructor(audioEngine, synth) {
        this.audioEngine = audioEngine;
        this.synth = synth; 
        this.bpm = 120;
        this.nextNoteTime = 0.0;
        this.currentStep = 0;
        this.isPlaying = false;
        this.timerID = null;
        this.trackManager = null;
        this.tracks = [];
        this.updateMatrixHeadCallback = null;
        this.randomChokeCallback = null;
    }

    setTrackManager(tm) { this.trackManager = tm; }
    setTracks(tracks) { this.tracks = tracks; }
    setTrackLibrary(tl) { this.trackLibrary = tl; }
    setUpdateMatrixHeadCallback(cb) { this.updateMatrixHeadCallback = cb; }
    setRandomChokeCallback(cb) { this.randomChokeCallback = cb; }
    setUpdateStatsCallback(cb) { this.updateStatsCallback = cb; }
    setGrooveGenerator(gg) { this.grooveGenerator = gg; }
    setPatternLibrary(pl) { this.patternLibrary = pl; }
    setSyncCallback(cb) { this.syncCallback = cb; }

    start(startTime) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = startTime || this.audioEngine.getContext().currentTime;
        this.run();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
        if (this.synth && this.synth.stopAll) this.synth.stopAll();
    }

    run() {
        if (!this.isPlaying) return;
        while (this.nextNoteTime < this.audioEngine.getContext().currentTime + 0.1) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.advanceStep();
        }
        this.timerID = setTimeout(() => this.run(), 25);
    }

    advanceStep() {
        this.nextNoteTime += 0.25 * (60.0 / this.bpm); 
        this.currentStep = (this.currentStep + 1) % 64;
    }

    scheduleStep(step, time) {
        const activeTracks = this.trackManager ? this.trackManager.getTracks() : this.tracks;
        if (!activeTracks) return;
        activeTracks.forEach(track => {
            const pattern = track.patterns ? track.patterns[track.currentPatternIdx] : null;
            if (pattern && pattern[step] > 0) {
                if (this.randomChokeCallback && this.randomChokeCallback(track, step)) return;
                if (this.synth) this.synth.scheduleNote(track, time, pattern[step]);
                EventBus.publish('STEP_TRIGGERED', { trackId: track.id, step, time });
            }
        });
        if (this.updateMatrixHeadCallback) this.updateMatrixHeadCallback(step);
    }

    setBpm(bpm) { this.bpm = bpm; }
}