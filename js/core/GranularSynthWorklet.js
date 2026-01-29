/**
 * GranularSynthWorklet Bridge
 */
export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.node = null;
        this.isReady = false;
        this.activeGrains = 0;
    }

    async init() {
        const ctx = this.audioEngine.getContext();
        this.node = new AudioWorkletNode(ctx, 'beatos-processor', { outputChannelCount: [2] });
        this.node.connect(ctx.destination);
        this.node.port.onmessage = (e) => {
            if (e.data.type === 'stats') this.activeGrains = e.data.activeGrains;
        };
        this.isReady = true;

        setInterval(() => {
            if (this.node) this.node.port.postMessage({ type: 'getStats' });
        }, 100);
    }

    getActiveGrainCount() { return this.activeGrains || 0; }
    setMaxGrains(max) { if (this.node) this.node.port.postMessage({ type: 'setMaxGrains', data: max }); }

    updateTrackBuffer(track) {
        if (!this.isReady || !track.buffer) return;
        const channelData = track.buffer.getChannelData(0);
        const bufferCopy = new Float32Array(channelData);
        this.node.port.postMessage({
            type: 'setBuffer',
            trackId: track.id,
            data: { buffer: bufferCopy, rmsMap: track.rmsMap }
        }, [bufferCopy.buffer]);
    }

    scheduleNote(track, time, velocityLevel = 2) {
        if (!this.isReady) return;
        const p = track.params;
        const velocity = velocityLevel === 3 ? 1.0 : velocityLevel === 1 ? 0.3 : 0.7;

        const density = p.density || 10;
        const duration = p.relGrain || 0.4;
        const grainCount = Math.min(32, Math.floor(density * duration));
        const interval = 1 / density;

        for (let i = 0; i < grainCount; i++) {
            this.node.port.postMessage({
                type: 'trigger',
                data: {
                    time: time + (i * interval),
                    trackId: track.id,
                    type: 'grain',
                    velocity: velocity * (1 - (i / grainCount) * 0.5),
                    position: p.position,
                    params: { ...p }
                }
            });
        }
    }

    stopAll() { if (this.node) this.node.port.postMessage({ type: 'stopAll' }); }
}