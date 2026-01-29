/**
 * BeatOS Granular & Drum Processor
 * High-performance audio thread handling all synthesis and timing.
 */

class BeatOSProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.MAX_GRAIN_VOICES = 128;
        this.currentFrame = 0;
        
        // Voice Pool for Granular Synthesis
        this.grainVoices = Array(this.MAX_GRAIN_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0,
            velocity: 1.0, trackId: null, pan: 0.5
        }));

        // Track Data Storage
        this.tracks = new Map(); // trackId -> { buffer, rmsMap }
        this.eventQueue = [];

        this.port.onmessage = (e) => {
            const { type, data, trackId } = e.data;
            switch(type) {
                case 'setBuffer':
                    this.tracks.set(trackId, { 
                        buffer: data.buffer, 
                        rmsMap: data.rmsMap ? data.rmsMap.map(v => v > 0.01) : null 
                    });
                    break;
                case 'trigger':
                    this.eventQueue.push(data);
                    this.eventQueue.sort((a, b) => a.time - b.time);
                    break;
                case 'stopAll':
                    this.grainVoices.forEach(v => v.active = false);
                    this.eventQueue = [];
                    break;
                case 'getStats':
                    const activeCount = this.grainVoices.filter(v => v.active).length;
                    this.port.postMessage({ type: 'stats', activeGrains: activeCount });
                    break;
            }
        };
    }

    findActivePosition(requestedPos, rmsMap) {
        if (!rmsMap) return requestedPos;
        const mapIdx = Math.floor(requestedPos * (rmsMap.length - 1));
        if (rmsMap[mapIdx]) return requestedPos;
        for (let i = 1; i < 40; i++) {
            if (rmsMap[mapIdx + i]) return (mapIdx + i) / (rmsMap.length - 1);
            if (rmsMap[mapIdx - i]) return (mapIdx - i) / (rmsMap.length - 1);
        }
        return requestedPos;
    }

    triggerGrain(event) {
        const track = this.tracks.get(event.trackId);
        if (!track || !track.buffer) return;

        let voice = this.grainVoices.find(v => !v.active);
        if (!voice) {
            voice = this.grainVoices[0]; 
            this.grainVoices.push(this.grainVoices.shift());
        }

        const p = event.params || {};
        let finalPos = event.position || 0;
        
        if (p.spray > 0) {
            finalPos += (Math.random() * 2 - 1) * p.spray;
            finalPos = Math.max(0, Math.min(1, finalPos));
        }

        if (track.rmsMap) {
            finalPos = this.findActivePosition(finalPos, track.rmsMap);
        }

        voice.active = true;
        voice.buffer = track.buffer;
        voice.bufferLength = track.buffer.length;
        voice.position = finalPos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor((p.grainSize || 0.1) * sampleRate));
        voice.pitch = p.pitch || 1.0;
        voice.velocity = event.velocity || 1.0;
        voice.pan = p.pan || 0.5;
        voice.trackId = event.trackId;
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const frameCount = output[0].length;
        const currentTime = this.currentFrame / sampleRate;

        while (this.eventQueue.length > 0 && this.eventQueue[0].time <= currentTime + (frameCount / sampleRate)) {
            const event = this.eventQueue.shift();
            if (event.type === 'grain') {
                this.triggerGrain(event);
            }
        }

        output[0].fill(0);
        output[1].fill(0);

        for (let v = 0; v < this.grainVoices.length; v++) {
            const voice = this.grainVoices[v];
            if (!voice.active) continue;

            for (let i = 0; i < frameCount; i++) {
                if (voice.phase >= voice.grainLength) {
                    voice.active = false;
                    break;
                }

                const readPos = (voice.position * voice.bufferLength + voice.phase * voice.pitch) % voice.bufferLength;
                const idx = Math.floor(readPos);
                const frac = readPos - idx;
                
                const s1 = voice.buffer[idx] || 0;
                const s2 = voice.buffer[(idx + 1) % voice.bufferLength] || 0;
                const sample = s1 + (s2 - s1) * frac;

                const env = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * voice.phase / voice.grainLength));
                const out = sample * env * voice.velocity;

                output[0][i] += out * (1 - voice.pan);
                output[1][i] += out * voice.pan;

                voice.phase++;
            }
        }

        for (let i = 0; i < frameCount; i++) {
            for (let c = 0; c < 2; c++) {
                output[c][i] = Math.tanh(output[c][i]); 
            }
        }

        this.currentFrame += frameCount;
        return true;
    }
}

registerProcessor('beatos-processor', BeatOSProcessor);