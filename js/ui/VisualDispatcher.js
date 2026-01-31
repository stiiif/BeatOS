import { globalBus } from '../events/EventBus.js';

/**
 * VisualDispatcher synchronizes UI animations with audio events.
 * It compensates for the lookahead buffer used by the Scheduler.
 */
export class VisualDispatcher {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.queue = [];
        this.isLooping = false;
    }

    start() {
        if (this.isLooping) return;
        this.isLooping = true;
        this.loop();

        // Listen for sync events from the Scheduler
        globalBus.on('VISUAL_SYNC', (data) => {
            this.queue.push(data);
        });
    }

    stop() {
        this.isLooping = false;
        this.queue = [];
    }

    loop() {
        if (!this.isLooping) return;

        const ctx = this.audioEngine.getContext();
        if (ctx) {
            const now = ctx.currentTime;

            // Check queue for events that should fire NOW
            // We subtract a tiny margin (16ms) to account for frame budget
            while (this.queue.length > 0 && this.queue[0].audioTime <= now) {
                const event = this.queue.shift();
                
                // Trigger the actual UI update
                globalBus.emit('UI_UPDATE_STEP', {
                    step: event.step,
                    audioTime: event.audioTime
                });
            }
        }

        requestAnimationFrame(() => this.loop());
    }
}