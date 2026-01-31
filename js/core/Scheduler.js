import { transport } from './Transport.js';
import { SCHEDULE_AHEAD_TIME, LOOKAHEAD } from '../utils/constants.js';

/**
 * Optimized Scheduler.
 * Acts as a bridge between the Transport (Logic) and the Synth (Audio).
 * It calculates WHERE we are in time and pushes the next block of notes.
 */
export class Scheduler {
    constructor(audioEngine, synthEngine) {
        this.audioEngine = audioEngine;
        this.synth = synthEngine;
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.tracks = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    start() {
        const audioCtx = this.audioEngine.getContext();
        this.nextNoteTime = audioCtx.currentTime + 0.05;
        transport.start();
        this.run();
    }

    stop() {
        transport.stop();
        clearTimeout(this.timerID);
    }

    run() {
        const audioCtx = this.audioEngine.getContext();
        
        // Schedule all steps that fall within the "Schedule Ahead" window
        while (this.nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
            this.scheduleStep(this.nextNoteTime);
            this.advanceNextNote();
        }
        
        this.timerID = setTimeout(() => this.run(), LOOKAHEAD);
    }

    advanceNextNote() {
        const secondsPer16th = (60.0 / transport.bpm) / 4.0;
        this.nextNoteTime += secondsPer16th;
        transport.advance(1);
    }

    scheduleStep(time) {
        const currentStep = transport.currentStep;

        // 1. Dispatch Visual Sync
        // Use requestAnimationFrame for smooth UI, but pass the exact audio time
        requestAnimationFrame(() => {
            transport.dispatchVisualSync(currentStep, time);
        });

        // 2. Iterate and trigger tracks
        this.tracks.forEach(track => {
            if (track.isMuted) return;
            
            const velocity = track.steps[currentStep];
            if (velocity > 0) {
                // High Precision Trigger
                // We send the note to the synth IMMEDIATELY. 
                // The synth (Worklet) will handle the sub-sample offset.
                this.synth.scheduleNote(track, time, velocity);
            }
        });
    }
}