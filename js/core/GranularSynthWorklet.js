import { TimeUtils } from '../utils/TimeUtils.js';

/**
 * GranularSynthWorklet - The Bridge
 * This class runs on the Main Thread and sends messages to the Processor.
 */
export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.loadedBuffers = new Set();
    }

    async init() {
        if (this.isInitialized) return;
        const audioCtx = this.audioEngine.getContext();
        
        // Ensure the processor file is fetched correctly
        // Note: The path here must point to the PROCESSOR file generated below
        await audioCtx.audioWorklet.addModule('./js/worklets/granular-processor.js');
        
        this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        this.isInitialized = true;
        console.log("Granular Synth Worklet Bridge Initialized");
    }

    scheduleNote(track, time, velocityLevel) {
        if (!this.isInitialized) return;
        
        const sampleRate = this.audioEngine.getContext().sampleRate;
        const targetSample = TimeUtils.secondsToSamples(time, sampleRate);
        const params = track.params;

        // Logic to calculate grain density/overlap
        const dur = params.grainSize;
        const interval = dur / Math.max(0.1, params.overlap || 1);
        const grains = Math.min(32, Math.ceil((params.relGrain || 0.4) / interval));

        this.ensureBufferLoaded(track);

        for (let i = 0; i < grains; i++) {
            const grainTime = targetSample + TimeUtils.secondsToSamples(i * interval, sampleRate);
            this.workletNode.port.postMessage({
                type: 'schedule',
                data: {
                    trackId: track.id,
                    sampleTime: grainTime,
                    position: params.position,
                    grainSize: params.grainSize,
                    pitch: params.pitch,
                    velocity: (velocityLevel / 3) * params.volume
                }
            });
        }
    }

    async ensureBufferLoaded(track) {
        if (this.loadedBuffers.has(track.id)) return;
        const channelData = track.buffer.getChannelData(0);
        const bufferCopy = new Float32Array(channelData);
        
        this.workletNode.port.postMessage({
            type: 'setBuffer',
            data: { trackId: track.id, buffer: bufferCopy, rmsMap: track.rmsMap }
        }, [bufferCopy.buffer]);
        
        this.loadedBuffers.add(track.id);
    }

    getActiveGrainCount() {
        // Implementation for performance monitor
        return 0; 
    }
}