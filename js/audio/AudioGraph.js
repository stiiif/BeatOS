import { AudioAnalysis } from '../utils/AudioAnalysis.js';

/**
 * AudioGraph - Manages the WebAudio node graph for all tracks.
 * Reconciles the audio graph based on state changes.
 */
export class AudioGraph {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        // Map<trackId, NodeChain>
        // NodeChain: { input, hp, lp, vol, pan, analyser }
        this.nodes = new Map(); 
    }

    /**
     * Helper to map 0-1 range to filter frequency
     */
    getMappedFrequency(value, type) {
        let min, max;
        if (type === 'hp') { min = 20; max = 5000; }
        else { min = 100; max = 10000; }

        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));

        if (type === 'lp') {
            return min + (max - min) * Math.pow(norm, 3);
        } else {
            return min + (max - min) * (1 - Math.pow(1 - norm, 3));
        }
    }

    /**
     * Create audio nodes for a single track
     * @param {number} trackId 
     * @param {Object} params - Initial parameters
     */
    createTrackNodes(trackId, params) {
        if (this.nodes.has(trackId)) return;

        const ctx = this.ctx;
        
        // Create Nodes
        const input = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        const lp = ctx.createBiquadFilter();
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();

        // Configure Nodes
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        hp.type = 'highpass';
        lp.type = 'lowpass';

        // Connect Chain: Input -> HP -> LP -> Vol -> Pan -> Analyser -> Destination
        input.connect(hp);
        hp.connect(lp);
        lp.connect(vol);
        vol.connect(pan);
        pan.connect(analyser);
        analyser.connect(ctx.destination);

        // Store reference
        const chain = { input, hp, lp, vol, pan, analyser };
        this.nodes.set(trackId, chain);

        // Apply initial values
        this.updateTrackParams(trackId, params);
    }

    /**
     * Update audio parameters for a track
     * @param {number} trackId 
     * @param {Object} params - Full params object or partial update
     */
    updateTrackParams(trackId, params) {
        const nodes = this.nodes.get(trackId);
        if (!nodes) return;

        const t = this.ctx.currentTime;

        // We use setTargetAtTime or simple assignment for responsiveness
        // Use a small ramp to prevent clicks
        const timeConstant = 0.01;

        if (params.hpFilter !== undefined) {
            const freq = this.getMappedFrequency(params.hpFilter, 'hp');
            nodes.hp.frequency.setTargetAtTime(freq, t, timeConstant);
        }
        
        if (params.filter !== undefined) {
            const freq = this.getMappedFrequency(params.filter, 'lp');
            nodes.lp.frequency.setTargetAtTime(freq, t, timeConstant);
        }

        if (params.volume !== undefined) {
            nodes.vol.gain.setTargetAtTime(params.volume, t, timeConstant);
        }

        if (params.pan !== undefined) {
            nodes.pan.pan.setTargetAtTime(params.pan, t, timeConstant);
        }
    }

    /**
     * Reconcile the graph with the current list of tracks from State
     * @param {Array} tracks - Array of track data objects from Store
     */
    reconcile(tracks) {
        // 1. Create missing tracks
        tracks.forEach(track => {
            if (!this.nodes.has(track.id)) {
                this.createTrackNodes(track.id, track.params);
            }
        });

        // 2. Remove deleted tracks (if any logic supported deletion)
        // (Simplified: assuming additive only for this step, but good practice to check)
        const trackIds = new Set(tracks.map(t => t.id));
        for (const [id, nodes] of this.nodes) {
            if (!trackIds.has(id)) {
                // Disconnect and remove
                nodes.input.disconnect();
                nodes.analyser.disconnect();
                this.nodes.delete(id);
            }
        }
    }

    /**
     * Get the input node for a track (to connect sources)
     */
    getTrackInput(trackId) {
        return this.nodes.get(trackId)?.input;
    }

    /**
     * Get the analyser node for visualization
     */
    getTrackAnalyser(trackId) {
        return this.nodes.get(trackId)?.analyser;
    }
}