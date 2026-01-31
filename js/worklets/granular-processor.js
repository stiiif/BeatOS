/**
 * BeatOS Granular Processor (Sample-Accurate Edition)
 * This code runs on the Audio Thread.
 */
class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0,
            velocity: 1.0, trackId: null
        }));
        this.eventQueue = [];
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'schedule':
                    this.eventQueue.push(data);
                    this.eventQueue.sort((a, b) => a.sampleTime - b.sampleTime);
                    break;
                case 'setBuffer':
                    this.trackBuffers.set(data.trackId, { buffer: data.buffer, rmsMap: data.rmsMap });
                    break;
                case 'stopAll':
                    this.voices.forEach(v => v.active = false);
                    this.eventQueue = [];
                    break;
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const frameCount = output[0].length;
        
        while (this.eventQueue.length > 0 && this.eventQueue[0].sampleTime < this.currentFrame + frameCount) {
            const event = this.eventQueue.shift();
            const offset = Math.max(0, Math.floor(event.sampleTime - this.currentFrame));
            this.triggerGrain(event, offset);
        }
        
        for (let channel = 0; channel < output.length; channel++) output[channel].fill(0);
        
        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            for (let i = 0; i < frameCount; i++) {
                if (voice.phase >= voice.grainLength) { voice.active = false; break; }
                const readPos = (voice.position * voice.bufferLength) + (voice.phase * voice.pitch);
                const idx = Math.floor(readPos % voice.bufferLength);
                const env = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * (voice.phase / voice.grainLength)));
                const val = voice.buffer[idx] * env * voice.velocity;
                output[0][i] += val;
                if (output.length > 1) output[1][i] += val;
                voice.phase++;
            }
        }
        
        this.currentFrame += frameCount;
        return true; 
    }
    
    triggerGrain(data, blockOffset) {
        const trackData = this.trackBuffers.get(data.trackId);
        if (!trackData) return;
        let voice = this.voices.find(v => !voice.active) || this.voices[0];
        voice.active = true;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = data.position;
        voice.phase = -blockOffset;
        voice.grainLength = Math.floor(data.grainSize * sampleRate);
        voice.pitch = data.pitch;
        voice.velocity = data.velocity;
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);