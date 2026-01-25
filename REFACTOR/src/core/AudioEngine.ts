import { store } from '../state/Store';
import { audioContext } from './AudioContext';
import { audioGraph } from './AudioGraph';
import { GranularSynth } from './GranularSynth';
import { SampleService } from '../services/SampleService';
import { TrackState } from '../types/state';

// Reactive Audio Engine
// Listens to Store -> Updates AudioGraph & Sample Buffers
export class AudioEngine {
    private granularSynth: GranularSynth;
    private buffers: Map<number, AudioBuffer> = new Map();
    private unsub: () => void;

    constructor() {
        this.granularSynth = new GranularSynth(this, audioGraph);
        
        // Subscribe to store changes
        this.unsub = store.subscribe(this.handleStateChange.bind(this));
        
        // Initial setup for existing tracks
        const state = store.getState();
        state.tracks.forEach(t => this.initTrack(t));
    }

    public getContext() {
        return audioContext.getContext();
    }

    public getBuffer(trackId: number): AudioBuffer | undefined {
        return this.buffers.get(trackId);
    }

    // Used by StorageService to load project buffers
    public setBuffer(trackId: number, buffer: AudioBuffer) {
        this.buffers.set(trackId, buffer);
        // Also update synth analysis map if needed
        this.granularSynth.analyzeBuffer(trackId, buffer);
    }

    // Direct synth access for Scheduler
    public getSynth() {
        return this.granularSynth;
    }

    private handleStateChange(state: ReturnType<typeof store.getState>) {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        state.tracks.forEach(track => {
            // 1. Initialize bus if missing
            if (!audioGraph.getBus(track.id)) {
                this.initTrack(track);
            }

            // 2. Update Params (Filter, Vol, Pan)
            // Optimization: Only update if changed? AudioGraph handles smoothing.
            audioGraph.updateTrackParams(track.id, track.params, now);

            // 3. Handle Sample Loading (Logic typically handled by Service, 
            // but we need to generate default buffers if type changes)
            this.ensureBufferExists(track);
        });
    }

    private initTrack(track: TrackState) {
        audioGraph.initTrack(track.id, track.params);
        this.ensureBufferExists(track);
    }

    private ensureBufferExists(track: TrackState) {
        // If track has a buffer already, skip
        if (this.buffers.has(track.id)) {
            // Check if we need to regenerate synthetic buffer (e.g. user clicked "Kick" gen)
            // This is tricky with reactive state. Ideally, an ACTION triggers generation.
            // For now, we assume if type is 'granular' but no sample is loaded, 
            // or if it's 'simple-drum' (which might use synthesis, no buffer needed for some), 
            // we let the Synth handle it or the UI dispatch a "GENERATE_BUFFER" action.
            
            // In the legacy code, switching types generated a buffer immediately.
            // In this architecture, the UI component calls a service to generate 
            // and calls `audioEngine.setBuffer()`.
            return; 
        }

        // Generate default buffer if missing
        if (track.type !== 'automation') {
            const buf = this.generateDefaultBuffer(track.type);
            if (buf) this.setBuffer(track.id, buf);
        }
    }

    // Ported from original generateBufferByType
    public generateDefaultBuffer(type: string): AudioBuffer | null {
        const ctx = this.getContext();
        // Simple placeholder generator implementation
        // The robust one is in GranularSynth or a GeneratorService. 
        // For brevity, we'll delegate to the legacy logic which we can put here or in a Utils file.
        // Let's implement a basic one to satisfy the contract.
        
        const len = 0.5;
        const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        
        // Simple noise/sine mix
        for(let i=0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i * 10 / ctx.sampleRate);
        }
        return buf;
    }
}

export const audioEngine = new AudioEngine();