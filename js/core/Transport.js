import { TimeUtils, PPQ } from '../utils/TimeUtils.js';
import { globalBus } from '../events/EventBus.js';

/**
 * Transport handles the global clock, playback state, and rhythmic position.
 * This is the "Source of Truth" for the sequencer.
 */
export class Transport {
    constructor() {
        this.isPlaying = false;
        this.bpm = 120;
        
        // Internal Counters
        this.currentTick = 0;
        this.currentStep = 0; // 16th note step
        this.totalStepsPlayed = 0;
        
        // Loop settings
        this.numSteps = 32;
    }

    setBPM(bpm) {
        this.bpm = Math.max(30, Math.min(300, bpm));
        globalBus.emit('TRANSPORT_BPM_CHANGE', this.bpm);
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        globalBus.emit('TRANSPORT_START', { time: performance.now() });
    }

    stop() {
        this.isPlaying = false;
        this.currentTick = 0;
        this.currentStep = 0;
        this.totalStepsPlayed = 0;
        globalBus.emit('TRANSPORT_STOP');
    }

    /**
     * Progresses the transport state. 
     * To be called by the Scheduler during the lookahead window.
     */
    advance(steps = 1) {
        const ticksPerStep = PPQ / 4; // Assuming 4 steps per quarter note
        
        this.totalStepsPlayed += steps;
        this.currentStep = (this.currentStep + steps) % this.numSteps;
        this.currentTick += steps * ticksPerStep;
        
        return {
            step: this.currentStep,
            totalSteps: this.totalStepsPlayed,
            tick: this.currentTick
        };
    }

    /**
     * Emits a visual sync event.
     * This decouples the audio thread timing from the UI animation.
     */
    dispatchVisualSync(step, audioTime) {
        globalBus.emit('VISUAL_SYNC', {
            step,
            audioTime,
            bpm: this.bpm
        });
    }
}

export const transport = new Transport();