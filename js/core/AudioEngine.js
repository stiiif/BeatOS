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

        // Do NOT automatically resume here. It must be triggered by a user gesture.
        // The context will likely be in 'suspended' state initially.

        // Subscribe to Store
        this.unsubscribes.push(
            appStore.on('STATE_CHANGED', this.handleStateChange)
        );
        
        // Initial reconciliation with current state
        if (appStore.state.tracks) {
             this.graph.reconcile(appStore.state.tracks);
        }
        
        console.log('[AudioEngine] Initialized (Suspended) and subscribed to store.');
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
            if (this.graph.nodes.has(trackId)) {
                this.graph.nodes.get(trackId).buffer = audioBuffer;
            }
            
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
            return this.ctx.resume();
        }
        return Promise.resolve();
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
        // Placeholder for drum triggering if not using GranularSynth
    }
}