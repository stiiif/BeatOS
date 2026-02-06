/**
 * BeatOS Granular Processor (Optimized)
 * - Linear Interpolation (Fast)
 * - Pre-calculated math
 * - Multi-channel routing support
 * - "Swap and Pop" array management
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
            // Pre-calc values to avoid division in loop
            invGrainLength: 0 
        }));
        
        // Track active indices to avoid scanning all 64 voices
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map(); 
        
        this.currentFrame = 0;

        // Hanning Window LUT
        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        for(let i=0; i<this.LUT_SIZE; i++) {
            const phase = i / (this.LUT_SIZE - 1);
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        
        // Optimization B: Pre-allocate buffers/vars for windowing and intermediate calculations
        this.tempBuffer = new Float32Array(128); // Placeholder for block ops if needed
        
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
        // outputs is [track0_stereo, track1_stereo, ...]
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
                // Calculate intervals
                let density = note.params.density || 20;
                if (density < 1) density = 1;
                
                let interval = 1 / density;
                
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }

                // Spawn grains needed for this time slice
                let spawnLimit = 5; // Limit spawns per block to prevent explosion
                while (note.nextGrainTime < now + (frameCount * 0.0000226) && spawnLimit > 0) { // approx 1/44100
                    if (note.nextGrainTime >= now) {
                        this.spawnGrainFromNote(note);
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        // Fast exit if no voices active
        if (this.activeVoiceIndices.length === 0) {
            this.currentFrame += frameCount;
            return true;
        }
        
        // --- 2. DSP LOOP ---
        // Iterate backwards for safe removal
        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const voiceIdx = this.activeVoiceIndices[i];
            const voice = this.voices[voiceIdx];
            
            // Get output buffer for this voice's track
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) {
                // Invalid routing, kill voice
                this.deactivateVoice(i);
                continue;
            }

            const leftChannel = trackOutput[0];
            const rightChannel = trackOutput[1]; // Assumes stereo
            const buffer = voice.buffer;
            const bufferLen = voice.bufferLength;
            
            // Optimization A: Block-Level Parameter Processing
            // Interpolate parameter changes at the block level (every 128 samples)
            // instead of per sample. Constant params are extracted here.
            const pitch = voice.pitch;
            const grainLen = voice.grainLength;
            const velocity = voice.velocity;
            const invGrainLen = voice.invGrainLength;
            const startPos = voice.position * bufferLen;
            
            let phase = voice.phase;
            let releasing = voice.releasing;
            let relAmp = voice.releaseAmp;
            
            // Optimization B: Zero-Allocation DSP Loop
            // Avoid variable declaration inside the loop. Hoist variables here.
            let j = 0;
            let readPos = 0.0;
            let idx = 0;
            let idx2 = 0;
            let frac = 0.0;
            let s1 = 0.0;
            let s2 = 0.0;
            let sample = 0.0;
            let lutIdx = 0;
            let window = 0.0;
            let out = 0.0;
            
            // Per-sample loop
            for (j = 0; j < frameCount; j++) {
                
                // Optimization C: Grain Culling (Dynamic Polyphony)
                // Amplitude Threshold Culler: Kill if envelope < -60dB (approx 0.001)
                // We check the release envelope AND the window phase to avoid cutting attack.
                if (releasing) {
                    relAmp -= 0.015; // Fast fade out
                    if (relAmp < 0.001) { // Threshold: -60dB
                        this.deactivateVoice(i);
                        break; // Stop processing this voice
                    }
                }

                if (phase >= grainLen) {
                    this.deactivateVoice(i);
                    break;
                }
                
                // LUT Windowing (Optimization: pre-calced 4095/grainLen)
                lutIdx = (phase * invGrainLen) | 0;
                window = this.windowLUT[lutIdx] || 0; // Safety fallback
                
                // Culling Check: If window gain is effectively silence and we are in decay phase
                if (window < 0.001 && phase > (grainLen >> 1)) {
                    this.deactivateVoice(i);
                    break;
                }
                
                // Calculate Read Head
                readPos = startPos + (phase * pitch);
                
                // Fast integer floor
                idx = readPos | 0; 
                
                // Wrap logic (Manual modulo is faster than %)
                while (idx >= bufferLen) idx -= bufferLen;
                
                // Linear Interpolation
                // frac = readPos - idx
                frac = readPos - idx;
                idx2 = idx + 1;
                if (idx2 >= bufferLen) idx2 = 0;
                
                s1 = buffer[idx];
                s2 = buffer[idx2];
                sample = s1 + frac * (s2 - s1);
                
                out = sample * window * velocity * relAmp;
                
                // Sum to output
                leftChannel[j] += out;
                if (rightChannel) rightChannel[j] += out;
                
                phase++;
            }
            
            // Save state
            voice.phase = phase;
            voice.releasing = releasing;
            voice.releaseAmp = relAmp;
        }
        
        this.currentFrame += frameCount;
        return true;
    }
    
    // Fast remove from active array (Swap & Pop)
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

        // Find free voice
        let voice = null;
        
        // 1. Try to find an inactive voice
        for (let i = 0; i < this.MAX_VOICES; i++) {
            if (!this.voices[i].active) {
                voice = this.voices[i];
                // Add to active list
                this.activeVoiceIndices.push(i);
                break;
            }
        }

        // 2. Steal voice if full (Oldest)
        if (!voice) {
            let oldestTime = Infinity;
            let oldestIdx = -1;
            
            // Only scan active indices
            for(let i=0; i<this.activeVoiceIndices.length; i++) {
                const v = this.voices[this.activeVoiceIndices[i]];
                if (!v.releasing && v.startFrame < oldestTime) {
                    oldestTime = v.startFrame;
                    oldestIdx = i;
                }
            }
            
            if (oldestIdx !== -1) {
                const vIdx = this.activeVoiceIndices[oldestIdx];
                // Force release the old one
                this.voices[vIdx].releasing = true;
                // We failed to spawn a NEW one, but we cleared space for next cycle
                // or we could force overwrite. Let's just return to avoid clicks.
                return; 
            }
        }

        // Initialize Voice
        let pos = note.params.position;
        if (note.params.spray > 0) {
            pos += (Math.random() * 2 - 1) * note.params.spray;
            // Clamp 0-1
            if(pos < 0) pos = 0; 
            if(pos > 1) pos = 1;
        }

        const sampleRate = 44100; // Standard, or pass in
        const gLen = Math.floor((note.params.grainSize || 0.1) * sampleRate);

        voice.active = true;
        voice.trackId = note.trackId;
        voice.buffer = trackData;
        voice.bufferLength = trackData.length;
        voice.position = pos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, gLen);
        voice.invGrainLength = 4095 / voice.grainLength; // Pre-calc for LUT
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