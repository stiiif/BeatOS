import { store } from '../../state/Store';
import { ActionTypes } from '../../state/actions';
import { audioEngine } from '../AudioEngine';
import { audioContext } from '../AudioContext';
import { NUM_STEPS } from '../../config/constants';

// Main Thread Scheduler
// Receives TICK from Worker -> Schedules Audio
export class Scheduler {
    private worker: Worker;
    private nextNoteTime: number = 0.0;
    private currentStep: number = 0;
    private totalStepsPlayed: number = 0;
    private lookahead = 25.0; // ms
    private scheduleAheadTime = 0.1; // s

    constructor() {
        // Initialize Worker
        this.worker = new Worker(new URL('./scheduler.worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (e) => {
            if (e.data === 'TICK') {
                this.schedule();
            }
        };

        // Listen to store for Play/Stop
        store.subscribe(this.handleStateChange.bind(this));
    }

    private handleStateChange(state: ReturnType<typeof store.getState>) {
        if (state.transport.isPlaying && this.nextNoteTime === 0) {
            // Started
            this.start();
        } else if (!state.transport.isPlaying && this.nextNoteTime !== 0) {
            // Stopped
            this.stop();
        }
    }

    private start() {
        const ctx = audioContext.getContext();
        this.nextNoteTime = ctx.currentTime + 0.1;
        this.currentStep = 0;
        this.totalStepsPlayed = 0;
        this.worker.postMessage('START');
    }

    private stop() {
        this.worker.postMessage('STOP');
        this.nextNoteTime = 0;
    }

    private schedule() {
        const ctx = audioContext.getContext();
        const state = store.getState();
        const bpm = state.transport.bpm;
        const secondsPerBeat = 60.0 / bpm;
        const stepTime = secondsPerBeat / 4; // 16th notes

        while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime, state);
            
            // Advance time
            this.nextNoteTime += stepTime;
            this.currentStep = (this.currentStep + 1) % NUM_STEPS;
            this.totalStepsPlayed++;
            
            // Update UI (Transport Tick)
            // We use requestAnimationFrame in UI to smooth this, but state update is key
            store.dispatch({
                type: ActionTypes.TRANSPORT_TICK,
                payload: { step: this.currentStep, total: this.totalStepsPlayed }
            });
        }
    }

    private scheduleStep(step: number, time: number, state: ReturnType<typeof store.getState>) {
        // 1. Check Choke Groups (Random Choke Logic)
        // (Simplified for brevity: assume winner logic from original is ported here)
        
        state.tracks.forEach(track => {
            if (track.triggers.muted) return;
            if (track.type === 'automation') return;

            const velocity = track.steps[step];
            if (velocity > 0) {
                // Apply Microtiming
                const offset = (track.microtiming[step] || 0) / 1000;
                
                // Trigger Synth
                audioEngine.getSynth().scheduleNote(track, time + offset, velocity);
                
                // Schedule Visuals (Dispatch event or direct call)
                // In flux, we might dispatch 'VISUALIZER_EVENT', or direct hook for performance
                // For high-perf audio visualization, direct hooks or EventBus are often preferred over Redux state
            }
        });
    }
}

export const scheduler = new Scheduler();