/**
 * BeatOS Granular Processor (Pro Specs)
 * - Optimized DSP Loop (Zero-Allocation)
 * - Dynamic Polyphony (Culling)
 * - High-Fidelity Audio (Tukey Window, Cubic Interpolation)
 * - Fast Math (XorShift Jitter)
 */

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.MAX_VOICES = 64;
        
        // Pre-allocate voices
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
            trackId: 0,
            releasing: false,
            releaseAmp: 1.0,
            invGrainLength: 0 
        }));
        
        // Track active indices to avoid scanning all 64 voices
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map(); 
        
        this.currentFrame = 0;

        // Optimization 3.C: Window Shaping (Tukey Window - "Raised Cosine")
        // Alpha = 0.5 (50% flat top, 50% fade) for "meatier" grains
        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        const alpha = 0.5; 
        
        for(let i=0; i<this.LUT_SIZE; i++) {
            const p = i / (this.LUT_SIZE - 1); // Normalized position 0..1
            
            if (p < alpha / 2) {
                // Fade In
                this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 1)));
            } else if (p > 1 - alpha / 2) {
                // Fade Out
                this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 2 / alpha + 1)));
            } else {
                // Flat Top
                this.windowLUT[i] = 1.0;
            }
        }
        
        // Optimization 3.B: Stochastic Jitter State (XorShift Seed)
        this._rngState = 0xCAFEBABE;
        
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
            }
        };
    }

    // Optimization 3.B: Bitwise XorShift Random Generator
    // Significantly faster than Math.random()
    random() {
        this._rngState ^= this._rngState << 13;
        this._rngState ^= this._rngState >>> 17;
        this._rngState ^= this._rngState << 5;
        return (this._rngState >>> 0) / 4294967296; // Normalize to 0..1
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
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        
        // --- 1. SCHEDULER (Runs once per block) ---
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (now > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            if (now >= note.startTime) {
                let density = note.params.density || 20;
                if (density < 1) density = 1;
                let interval = 1 / density;
                
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }

                let spawnLimit = 5;
                while (note.nextGrainTime < now + (frameCount * 0.0000226) && spawnLimit > 0) {
                    if (note.nextGrainTime >= now) {
                        this.spawnGrainFromNote(note);
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        if (this.activeVoiceIndices.length === 0) {
            this.currentFrame += frameCount;
            return true;
        }
        
        // --- 2. DSP LOOP ---
        // Optimization 2.B: Zero-Allocation (Hoist variables)
        let j=0, readPos=0.0, idx=0, frac=0.0, sample=0.0, lutIdx=0, window=0.0, out=0.0;
        let i0=0, i1=0, i2=0, i3=0;
        let y0=0, y1=0, y2=0, y3=0;
        let c0=0, c1=0, c2=0, c3=0;

        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const voiceIdx = this.activeVoiceIndices[i];
            const voice = this.voices[voiceIdx];
            
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) {
                this.deactivateVoice(i);
                continue;
            }

            const leftChannel = trackOutput[0];
            const rightChannel = trackOutput[1];
            const buffer = voice.buffer;
            const bufferLen = voice.bufferLength;
            
            // Optimization 2.A: Block-Level Parameter Processing
            const pitch = voice.pitch;
            const grainLen = voice.grainLength;
            const velocity = voice.velocity;
            const invGrainLen = voice.invGrainLength;
            const startPos = voice.position * bufferLen;
            
            // Optimization 3.A: Conditional Cubic Flag
            // Only use expensive cubic interp when pitch shifting causes aliasing
            const useCubic = (pitch > 1.2 || pitch < 0.8);

            let phase = voice.phase;
            let releasing = voice.releasing;
            let relAmp = voice.releaseAmp;
            
            for (j = 0; j < frameCount; j++) {
                // Optimization 2.C: Grain Culling
                if (releasing) {
                    relAmp -= 0.015;
                    if (relAmp < 0.001) { // -60dB Culling
                        this.deactivateVoice(i);
                        break;
                    }
                }

                if (phase >= grainLen) {
                    this.deactivateVoice(i);
                    break;
                }
                
                // Read Head Calculation
                readPos = startPos + (phase * pitch);
                idx = readPos | 0; // Integer floor
                
                // Wrap Logic
                while (idx >= bufferLen) idx -= bufferLen;
                
                // Fraction for interpolation
                frac = readPos - idx;

                // Optimization 3.A: High-Order Interpolation (Cubic Hermite)
                if (useCubic) {
                    // 4-point indices handling wrap
                    i1 = idx;
                    
                    i0 = i1 - 1; 
                    if (i0 < 0) i0 += bufferLen;
                    
                    i2 = i1 + 1; 
                    if (i2 >= bufferLen) i2 -= bufferLen;
                    
                    i3 = i2 + 1; 
                    if (i3 >= bufferLen) i3 -= bufferLen;

                    y0 = buffer[i0];
                    y1 = buffer[i1];
                    y2 = buffer[i2];
                    y3 = buffer[i3];

                    // 4-point, 3rd-order Hermite Spline
                    c0 = y1;
                    c1 = 0.5 * (y2 - y0);
                    c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
                    c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

                    sample = ((c3 * frac + c2) * frac + c1) * frac + c0;
                } else {
                    // Standard Linear Interpolation (Fast)
                    i2 = idx + 1;
                    if (i2 >= bufferLen) i2 = 0;
                    
                    const s1 = buffer[idx];
                    const s2 = buffer[i2];
                    sample = s1 + frac * (s2 - s1);
                }
                
                // Windowing (Tukey)
                lutIdx = (phase * invGrainLen) | 0;
                window = this.windowLUT[lutIdx] || 0;
                
                // Optimization 2.C: Culling Silent Windows
                if (window < 0.001 && phase > (grainLen >> 1)) {
                    this.deactivateVoice(i);
                    break;
                }
                
                out = sample * window * velocity * relAmp;
                
                leftChannel[j] += out;
                if (rightChannel) rightChannel[j] += out;
                
                phase++;
            }
            
            voice.phase = phase;
            voice.releasing = releasing;
            voice.releaseAmp = relAmp;
        }
        
        this.currentFrame += frameCount;
        return true;
    }
    
    deactivateVoice(activeArrayIndex) {
        const voiceIdx = this.activeVoiceIndices[activeArrayIndex];
        this.voices[voiceIdx].active = false;
        
        const last = this.activeVoiceIndices.pop();
        if (activeArrayIndex < this.activeVoiceIndices.length) {
            this.activeVoiceIndices[activeArrayIndex] = last;
        }
    }

    spawnGrainFromNote(note) {
        const trackData = this.trackBuffers.get(note.trackId);
        if (!trackData) return;

        let voice = null;
        for (let i = 0; i < this.MAX_VOICES; i++) {
            if (!this.voices[i].active) {
                voice = this.voices[i];
                this.activeVoiceIndices.push(i);
                break;
            }
        }

        if (!voice) {
            let oldestTime = Infinity;
            let oldestIdx = -1;
            for(let i=0; i<this.activeVoiceIndices.length; i++) {
                const v = this.voices[this.activeVoiceIndices[i]];
                if (!v.releasing && v.startFrame < oldestTime) {
                    oldestTime = v.startFrame;
                    oldestIdx = i;
                }
            }
            if (oldestIdx !== -1) {
                const vIdx = this.activeVoiceIndices[oldestIdx];
                this.voices[vIdx].releasing = true;
                return; 
            }
        }

        let pos = note.params.position;
        if (note.params.spray > 0) {
            // Optimization 3.B: Use Fast Random
            pos += (this.random() * 2 - 1) * note.params.spray;
            if(pos < 0) pos = 0; 
            if(pos > 1) pos = 1;
        }

        const sampleRate = 44100;
        const gLen = Math.floor((note.params.grainSize || 0.1) * sampleRate);

        voice.active = true;
        voice.trackId = note.trackId;
        voice.buffer = trackData;
        voice.bufferLength = trackData.length;
        voice.position = pos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, gLen);
        voice.invGrainLength = 4095 / voice.grainLength;
        voice.pitch = note.params.pitch || 1.0;
        voice.velocity = note.params.velocity || 1.0;
        voice.startFrame = this.currentFrame;
        voice.releasing = false;
        voice.releaseAmp = 1.0;
    }

    setBuffer(id, buf) {
        this.trackBuffers.set(id, buf);
    }

    stopAllVoices() {
        for (let i = 0; i < this.activeVoiceIndices.length; i++) {
            const v = this.voices[this.activeVoiceIndices[i]];
            v.releasing = true;
        }
    }

    stopTrack(id) {
        this.activeNotes = this.activeNotes.filter(n => n.trackId !== id);
        for (let i = 0; i < this.activeVoiceIndices.length; i++) {
            const v = this.voices[this.activeVoiceIndices[i]];
            if (v.trackId === id) v.releasing = true;
        }
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);