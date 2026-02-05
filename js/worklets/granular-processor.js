// BeatOS Granular Synthesis AudioWorklet Processor
// Optimization: Linear Interpolation (Fast)
// Optimization: Active Voice Tracking (Only loop active voices)

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id,
            active: false,
            buffer: null,
            bufferLength: 0,
            position: 0,
            phase: 0,
            grainLength: 0,
            pitch: 1.0,
            velocity: 1.0,
            startFrame: 0,
            trackId: null,
            releasing: false,
            releaseAmp: 1.0
        }));
        
        // OPTIMIZATION: Track active indices to avoid looping 64 items every frame
        this.activeVoiceIndices = [];
        
        this.activeNotes = [];
        this.trackBuffers = new Map(); 
        
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;

        // Window Function Lookup Table (Hanning)
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            const phase = i / 4095;
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'trigger': this.triggerGrain(data); break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'updateBuffer': this.updateBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'getStats': this.sendStats(); break;
            }
        };
    }

    handleNoteOn(data) {
        const { trackId, time, duration, params } = data;
        this.activeNotes.push({
            trackId,
            startTime: time,
            duration: duration,
            params: params,
            nextGrainTime: time
        });
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length; 
        const now = currentTime; 
        
        // 1. Scheduler Logic (Runs once per block)
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (now > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            if (now >= note.startTime) {
                let density = Math.max(1, note.params.density || 20);
                let interval = 1 / density;
                
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }

                let grainsSpawnedThisBlock = 0;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && grainsSpawnedThisBlock < 10) {
                    if (note.nextGrainTime >= now) {
                        this.spawnGrainFromNote(note);
                    }
                    note.nextGrainTime += interval;
                    grainsSpawnedThisBlock++;
                }
            }
        }

        if (channelCount === 0) return true;
        
        // Clear buffers
        for (let channel = 0; channel < channelCount; channel++) {
            output[channel].fill(0);
        }
        
        // 2. DSP Logic (Only loop ACTIVE voices)
        // OPTIMIZATION: Use activeVoiceIndices array
        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const voiceIdx = this.activeVoiceIndices[i];
            const voice = this.voices[voiceIdx];
            
            // Safety check
            if (!voice.active) {
                this.activeVoiceIndices.splice(i, 1);
                continue;
            }
            
            const buffer = voice.buffer;
            const bufferLength = voice.bufferLength;
            
            for (let j = 0; j < frameCount; j++) {
                if (voice.releasing) {
                    voice.releaseAmp -= (1.0 / 64.0); 
                    if (voice.releaseAmp <= 0) {
                        voice.active = false;
                        voice.releasing = false;
                        this.activeVoiceIndices.splice(i, 1); // Remove from active list
                        break; 
                    }
                }

                if (voice.phase >= voice.grainLength) {
                    voice.active = false;
                    this.activeVoiceIndices.splice(i, 1); // Remove from active list
                    break;
                }
                
                const baseReadPos = voice.position * bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                
                let idx = Math.floor(readPos);
                if (idx >= bufferLength) idx %= bufferLength;
                const frac = readPos - Math.floor(readPos);

                // Linear Interpolation
                const idx2 = (idx + 1) < bufferLength ? idx + 1 : 0;
                const s1 = buffer[idx];
                const s2 = buffer[idx2];
                const sample = s1 + frac * (s2 - s1);
                
                const lutIndex = Math.floor((voice.phase / voice.grainLength) * 4095);
                const envelope = this.windowLUT[lutIndex] || 0;
                
                const outputSample = sample * envelope * voice.velocity * voice.releaseAmp;
                
                output[0][j] += outputSample;
                if (channelCount > 1) {
                    output[1][j] += outputSample;
                }
                
                voice.phase++;
            }
        }
        
        // Soft limiter
        const outputGain = 0.5;
        for (let channel = 0; channel < channelCount; channel++) {
            for (let i = 0; i < frameCount; i++) {
                const sample = output[channel][i] * outputGain;
                if (sample < -3) output[channel][i] = -1;
                else if (sample > 3) output[channel][i] = 1;
                else output[channel][i] = sample * (27 + sample * sample) / (27 + 9 * sample * sample);
            }
        }
        
        this.currentFrame += frameCount;
        
        return true;
    }
    
    spawnGrainFromNote(note) {
        const { params } = note;
        const trackData = this.trackBuffers.get(note.trackId);
        
        if (!trackData || !trackData.buffer) return;

        let voice = null;
        let oldestIndex = -1;
        let oldestFrame = Infinity;

        // Find free voice
        for (let i = 0; i < this.MAX_VOICES; i++) {
            const v = this.voices[i];
            if (!v.active) {
                voice = v;
                break;
            }
            if (v.startFrame < oldestFrame) {
                oldestFrame = v.startFrame;
                oldestIndex = i;
            }
        }

        if (!voice && oldestIndex !== -1) {
            voice = this.voices[oldestIndex];
            voice.releasing = true; 
            // Don't remove from active indices, it's already there
        } else if (voice) {
            // New voice, add to active list if not present
            if (!this.activeVoiceIndices.includes(voice.id)) {
                this.activeVoiceIndices.push(voice.id);
            }
        }

        let finalPos = params.position;
        if (params.spray > 0) {
            finalPos += (Math.random() * 2 - 1) * params.spray;
            finalPos = Math.max(0, Math.min(1, finalPos));
        }

        voice.active = true;
        voice.trackId = note.trackId;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = finalPos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor((params.grainSize || 0.1) * sampleRate));
        voice.pitch = Math.max(0.05, Math.min(8.0, params.pitch || 1.0));
        voice.velocity = params.velocity || 1.0;
        voice.startFrame = this.currentFrame;
        voice.releasing = false;
        voice.releaseAmp = 1.0;

        this.totalGrainsTriggered++;
    }

    triggerGrain(data) { /* Legacy stub */ }
    setBuffer(id, buf, map) {
        let processed = map ? map.map(v => v > 0.01) : null;
        this.trackBuffers.set(id, { buffer: buf, rmsMap: processed });
        this.port.postMessage({ type: 'bufferLoaded', trackId: id, bufferLength: buf.length });
    }
    updateBuffer(id, buf, map) { this.setBuffer(id, buf, map); }
    stopAllVoices() {
        for (let i=0; i<this.voices.length; i++) { 
            if(this.voices[i].active) { this.voices[i].releasing = true; this.voices[i].releaseAmp = 1.0; } 
        }
    }
    stopTrack(trackId) {
        for (let i=0; i<this.voices.length; i++) { 
            if(this.voices[i].trackId === trackId && this.voices[i].active) { 
                this.voices[i].releasing = true; this.voices[i].releaseAmp = 1.0; 
            } 
        }
        this.activeNotes = this.activeNotes.filter(n => n.trackId !== trackId);
    }
    sendStats() {
        this.port.postMessage({ type: 'stats', data: { activeVoices: this.activeVoiceIndices.length } });
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);