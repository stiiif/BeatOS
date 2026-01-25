import { appStore } from '../state/Store.js';
import { ACTIONS } from '../state/Actions.js';
import { AudioGraph } from '../audio/AudioGraph.js';
import { AudioAnalysis } from '../utils/AudioAnalysis.js';

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.graph = null;
        this.unsubscribes = [];
        
        // Bind methods
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    /**
     * Initialize AudioContext and Graph
     */
    async initialize() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.graph = new AudioGraph(this.ctx);
        }

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // Subscribe to Store
        this.unsubscribes.push(
            appStore.on('STATE_CHANGED', this.handleStateChange)
        );
        
        // Initial reconciliation with current state
        this.graph.reconcile(appStore.state.tracks);
        
        console.log('[AudioEngine] Initialized and subscribed to store.');
        return this.ctx;
    }

    /**
     * Handle state changes from the Store
     */
    handleStateChange({ key, value }) {
        if (!this.ctx || !this.graph) return;

        // 1. If the tracks array structure changed (add/remove), reconcile graph
        if (key === 'tracks') {
            this.graph.reconcile(value);
        }
    }

    /**
     * Helper to load samples (Can be moved to a Service later)
     */
    async loadSample(file, trackId) {
        if (!this.ctx) return null;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            // Decode
            let audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            
            // Auto-trim silence using our utility
            audioBuffer = AudioAnalysis.trimBuffer(this.ctx, audioBuffer);
            
            // We need to store this buffer somewhere associated with the track ID.
            // Since `Track.js` is now pure data, we can store it in the AudioGraph 
            // or a dedicated BufferManager. For now, let's put it in the Graph's node entry 
            // or a separate map in this engine.
            this.graph.nodes.get(trackId).buffer = audioBuffer;
            
            return audioBuffer;
        } catch (err) {
            console.error('[AudioEngine] Sample load failed:', err);
            throw err;
        }
    }

    /**
     * Resume context (user interaction requirement)
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    /**
     * Get the AudioContext (needed for Scheduler)
     */
    getContext() {
        return this.ctx;
    }
    
    /**
     * Trigger a drum sound (Simple 909 synthesis) directly
     * This logic mimics the old AudioEngine but uses the new Graph nodes
     */
    triggerDrum(trackId, time, velocityLevel, params) {
        const nodes = this.graph.nodes.get(trackId);
        if (!nodes) return;
        
        // Implementation of drum synthesis would go here, 
        // connecting to nodes.input instead of internal bus
        // (For brevity, we will implement the full synth logic in the next integration phase 
        // or keep it in a separate Synth module)
    }
}