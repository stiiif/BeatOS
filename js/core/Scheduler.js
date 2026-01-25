import { appStore } from '../state/Store.js';
import { ACTIONS } from '../state/Actions.js';
import { LOOKAHEAD, SCHEDULE_AHEAD_TIME, NUM_STEPS } from '../utils/constants.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.lastStep = -1;

        // Bind for loop
        this.schedule = this.schedule.bind(this);
        
        // Listen to store for play/stop commands if needed, 
        // though usually main.js calls start/stop.
    }

    get bpm() {
        return appStore.state.bpm;
    }

    get isPlaying() {
        return appStore.state.isPlaying;
    }

    start() {
        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx) return;

        if (this.isPlaying) return;

        // Dispatch playing state
        appStore.dispatch(ACTIONS.SET_PLAYING, true);

        // Reset timing
        this.nextNoteTime = audioCtx.currentTime + 0.1;
        this.lastStep = -1; // Reset last step
        
        // Optionally reset step to 0 in store
        appStore.dispatch(ACTIONS.SET_CURRENT_STEP, { step: 0 });

        this.schedule();
    }

    stop() {
        this.isPlaying = false;
        appStore.dispatch(ACTIONS.SET_PLAYING, false);
        clearTimeout(this.timerID);
        
        // Stop all active sources via Engine/Graph
        // (Assuming AudioGraph has a method to stop all, or we iterate tracks)
        // For now, we rely on the node disconnect or GC, or implement stopAll later.
    }

    schedule() {
        if (!this.isPlaying) return;

        const audioCtx = this.audioEngine.getContext();
        const state = appStore.state;

        while (this.nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
            this.scheduleStep(state.currentStep, this.nextNoteTime);
            this.advanceStep();
        }

        this.timerID = window.setTimeout(this.schedule, LOOKAHEAD);
    }

    advanceStep() {
        const secondsPerBeat = 60.0 / this.bpm;
        // 16th notes = 1/4 of a beat
        this.nextNoteTime += 0.25 * secondsPerBeat;

        const nextStep = (appStore.state.currentStep + 1) % NUM_STEPS;
        appStore.dispatch(ACTIONS.SET_CURRENT_STEP, { step: nextStep });
    }

    scheduleStep(stepIndex, time) {
        // Only schedule if we haven't already for this step/time combo (simple debounce)
        // Note: In this loop logic, stepIndex changes every iteration, so it's safe.

        const tracks = appStore.state.tracks;
        
        // Trigger generic visualization event if needed (or components listen to SET_CURRENT_STEP)
        
        tracks.forEach(track => {
            if (track.muted) return;

            // Get velocity/trigger for this step
            const velocity = track.steps[stepIndex];
            
            if (velocity > 0) {
                // V2: Microtiming logic would go here (offset 'time')
                // const offset = track.microtiming[stepIndex] / 1000;
                
                // Trigger Sound
                // We pass the clean track data object. 
                // The synth needs to look up the buffer from the AudioGraph or Engine.
                this.granularSynth.scheduleNote(track, time, velocity);
                
                // Trigger Visuals (Flash)
                // We can emit a specific event for visualizers to pick up
                // globalBus.emit('TRACK_TRIGGERED', { trackId: track.id, time });
            }
        });
    }
}