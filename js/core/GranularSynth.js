/**
 * GranularSynth
 * * Main thread controller for the granular synthesis engine.
 * Communicates with the AudioWorklet.
 */

class GranularSynth {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.node = null;
        this.ready = false;
        this.defaults = {
            density: 0.1,    // Grain duration in seconds
            spray: 0,       // Position randomness
            pitch: 1,       // Playback rate
            position: 0,    // Playhead position (0-1)
            volume: 0.75,
            reverse: false
        };
    }

    async initialize() {
        try {
            await this.ctx.audioWorklet.addModule('js/worklets/granular-processor.js');
            this.node = new AudioWorkletNode(this.ctx, 'granular-processor');
            this.node.connect(this.ctx.destination);
            this.ready = true;
            console.log("GranularSynth initialized successfully");
        } catch (e) {
            console.error("Error initializing GranularSynth:", e);
        }
    }

    loadSample(buffer) {
        if (!this.ready || !this.node) return;
        
        // Send buffer to worklet
        const channelData = buffer.getChannelData(0);
        
        this.node.port.postMessage({
            type: 'buffer',
            buffer: channelData
        });
    }

    /**
     * Trigger a grain burst
     * @param {number} time - The AudioContext time to start playback
     * @param {Object} params - Synthesis parameters
     */
    trigger(time, params = {}) {
        if (!this.ready || !this.node) return;

        const combinedParams = { ...this.defaults, ...params };

        // Post message to worklet with the specific START TIME
        this.node.port.postMessage({
            type: 'trigger',
            startTime: time,
            ...combinedParams
        });
    }

    /**
     * Stop all playback immediately
     * Clears the worklet queue and silences active grains
     */
    stop() {
        if (!this.ready || !this.node) return;
        this.node.port.postMessage({ type: 'stop' });
    }

    disconnect() {
        if (this.node) {
            this.node.disconnect();
            this.node = null;
        }
    }
}

export { GranularSynth };