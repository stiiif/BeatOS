// BeatOS Granular Synthesis AudioWorklet Processor
// Runs on dedicated audio rendering thread for ultra-low latency
// Supports: polyphonic grains, pitch shifting, RMS-based position finding, velocity
// Phase 1 Improvements: Cubic Interpolation, Window LUT, De-clicking
// Phase 2 Improvements: Event-Based Internal Scheduling

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // Voice pool for polyphonic grains (64 simultaneous grains!)
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id,
            active: false,
            
            // Buffer data
            buffer: null,
            bufferLength: 0,
            
            // Grain parameters
            position: 0,          // Position in buffer (0-1)
            phase: 0,             // Current sample within grain
            grainLength: 0,       // Grain length in samples
            pitch: 1.0,
            velocity: 1.0,
            
            // Timing
            startFrame: 0,
            
            // Track routing
            trackId: null,

            // De-clicking / Release
            releasing: false,
            releaseAmp: 1.0
        }));
        
        // Active Notes (Internal Scheduler)
        // Stores notes that are currently generating grains
        this.activeNotes = [];

        // Shared buffers (transferred from main thread)
        this.trackBuffers = new Map(); // trackId -> { buffer: Float32Array, rmsMap: boolean[] }
        
        // Stats
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;

        // Phase 1.2: Window Function Lookup Table (Hanning)
        // Pre-calculating this reduces CPU load by avoiding Math.cos() per sample
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            const phase = i / 4095;
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        
        // Message handling from main thread
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            
            switch(type) {
                case 'trigger': // Legacy trigger (single grain)
                    this.triggerGrain(data);
                    break;
                
                case 'noteOn': // Phase 2: New Event-Based Trigger
                    this.handleNoteOn(data);
                    break;
                    
                case 'setBuffer':
                    this.setBuffer(data.trackId, data.buffer, data.rmsMap);
                    break;
                    
                case 'updateBuffer':
                    this.updateBuffer(data.trackId, data.buffer, data.rmsMap);
                    break;
                    
                case 'stopAll':
                    this.stopAllVoices();
                    this.activeNotes = []; // Clear scheduler
                    break;
                    
                case 'stopTrack':
                    this.stopTrack(data.trackId);
                    break;
                    
                case 'getStats':
                    this.sendStats();
                    break;
            }
        };
    }

    // Phase 1.1: Cubic Hermite Interpolation
    // Returns a much smoother interpolated value than linear (less metallic artifacts)
    cubicHermite(y0, y1, y2, y3, x) {
        const c0 = y1;
        const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
        
        return ((c3 * x + c2) * x + c1) * x + c0;
    }
    
    // Phase 2: Handle Note On Event
    handleNoteOn(data) {
        const { trackId, time, duration, params } = data;
        
        // Convert Start Time to Frame Count (approx) or keep as time
        // Note: 'currentFrame' is local to this processor since start.
        // Ideally we sync 'time' with audioContext.currentTime but accessing that inside Worklet is tricky directly.
        // We assume 'time' passed in is relative to AudioContext.currentTime.
        // However, 'currentTime' in process() is available globally in AudioWorkletGlobalScope, or we track locally.
        // Standard practice: Pass 'currentTime' from main thread or use relative offsets.
        // Better: Main thread sends 'startTime' relative to NOW.
        // If data.time is absolute AudioContext time, we need to know current AudioContext time.
        // Using 'currentTime' (global in Worklet)
        
        this.activeNotes.push({
            trackId,
            startTime: time,
            duration: duration, // in seconds
            params: params, // { density, grainSize, position, spray, pitch, etc }
            nextGrainTime: time // Schedule first grain immediately at start time
        });
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length; // Always 128 samples
        
        // Global time in seconds (provided by AudioWorkletGlobalScope)
        const now = currentTime; 
        
        // Phase 2: Internal Grain Scheduler
        // Iterate backwards to allow removal
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            // Check if note is finished
            if (now > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            // Check if note has started
            if (now >= note.startTime) {
                // Determine density interval
                let density = Math.max(1, note.params.density || 20);
                let interval = 1 / density;
                
                // Overlap logic (if provided) overrides density
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }

                // Spawn grains until nextGrainTime is in the future
                // We limit the number of grains per block to prevent infinite loops if density is insane
                let grainsSpawnedThisBlock = 0;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && grainsSpawnedThisBlock < 10) {
                    if (note.nextGrainTime >= now) {
                        // Time to spawn!
                        // Apply randomization/spray here in the scheduler
                        this.spawnGrainFromNote(note);
                    }
                    note.nextGrainTime += interval;
                    grainsSpawnedThisBlock++;
                }
            }
        }

        if (channelCount === 0) return true;
        
        // Clear output buffers
        for (let channel = 0; channel < channelCount; channel++) {
            output[channel].fill(0);
        }
        
        // Process each active voice
        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            
            // Generate samples for this grain
            for (let i = 0; i < frameCount; i++) {
                // Phase 1.3: De-clicking (Release Envelope)
                if (voice.releasing) {
                    voice.releaseAmp -= (1.0 / 64.0); // Fade out over 64 samples
                    if (voice.releaseAmp <= 0) {
                        voice.active = false;
                        voice.releasing = false;
                        break; // Stop processing this voice immediately
                    }
                }

                if (voice.phase >= voice.grainLength) {
                    // Grain finished naturally
                    voice.active = false;
                    break;
                }
                
                // Calculate buffer read position with pitch shift
                const baseReadPos = voice.position * voice.bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                
                // Wrap position if needed
                const wrappedPos = readPos % voice.bufferLength;
                const sampleIndex = Math.floor(wrappedPos);
                const frac = wrappedPos - sampleIndex;

                // Phase 1.1: Cubic Interpolation
                // Fetch 4 samples for Hermite interpolation
                const idx0 = (sampleIndex - 1 + voice.bufferLength) % voice.bufferLength;
                const idx1 = sampleIndex;
                const idx2 = (sampleIndex + 1) % voice.bufferLength;
                const idx3 = (sampleIndex + 2) % voice.bufferLength;

                const y0 = voice.buffer[idx0] || 0;
                const y1 = voice.buffer[idx1] || 0;
                const y2 = voice.buffer[idx2] || 0;
                const y3 = voice.buffer[idx3] || 0;

                const sample = this.cubicHermite(y0, y1, y2, y3, frac);
                
                // Phase 1.2: Apply Hann window envelope using LUT
                // Map phase (0 to grainLength) to LUT size (0 to 4096)
                const lutIndex = Math.floor((voice.phase / voice.grainLength) * 4095);
                // Safety clamp
                const safeLutIndex = Math.max(0, Math.min(4095, lutIndex));
                const envelope = this.windowLUT[safeLutIndex];
                
                // Apply velocity, window envelope, and release envelope
                const outputSample = sample * envelope * voice.velocity * voice.releaseAmp;
                
                // Mix to output (mono source -> stereo output)
                output[0][i] += outputSample;
                if (channelCount > 1) {
                    output[1][i] += outputSample;
                }
                
                voice.phase++;
            }
        }
        
        // Soft limiter to prevent clipping (fast tanh approximation)
        const outputGain = 0.5; // Pre-gain to avoid clipping with many voices
        for (let channel = 0; channel < channelCount; channel++) {
            for (let i = 0; i < frameCount; i++) {
                const sample = output[channel][i] * outputGain;
                // Fast tanh approximation
                const x = Math.max(-3, Math.min(3, sample));
                output[channel][i] = x * (27 + x * x) / (27 + 9 * x * x);
            }
        }
        
        this.currentFrame += frameCount;
        
        return true; // Keep processor alive
    }
    
    // Phase 2: Helper to spawn grain from note params
    spawnGrainFromNote(note) {
        const { params } = note;
        const trackData = this.trackBuffers.get(note.trackId);
        
        if (!trackData || !trackData.buffer) return;

        // Find free voice or steal
        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            voice = this.voices.reduce((oldest, v) => 
                v.startFrame < oldest.startFrame ? v : oldest
            );
            // Quick fade out for stolen voice to avoid click
            voice.releasing = true; 
            // In a real scenario, we might want to allocate a NEW voice and fade the old one,
            // but for fixed polyphony, we hard reset here after fading next block?
            // For now, hard reset but rely on overlap masking it mostly. 
            // Actually, simply resetting logic:
        }

        // Apply parameters from Note
        // Note: Main thread calculates effective position (including LFOs) at Note On
        // Ideally, we'd calculate LFOs here for sample accuracy, but passing LFO state is complex.
        // We will stick to "Params at trigger time" for simplicity, or simple linear interpolation if params are automated.
        
        let finalPos = params.position;
        
        // Apply Spray (Randomness)
        if (params.spray > 0) {
            finalPos += (Math.random() * 2 - 1) * params.spray;
            finalPos = Math.max(0, Math.min(1, finalPos));
        }

        // Initialize voice
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

    triggerGrain(data) {
        const {
            trackId,
            position = 0.5,
            grainSize = 0.1,
            pitch = 1.0,
            velocity = 1.0,
            spray = 0.0,
            useRmsMap = true
        } = data;
        
        const trackData = this.trackBuffers.get(trackId);
        if (!trackData || !trackData.buffer) {
            return;
        }
        
        // Find free voice
        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            // Voice stealing: take the oldest grain
            voice = this.voices.reduce((oldest, v) => 
                v.startFrame < oldest.startFrame ? v : oldest
            );
        }
        
        // Apply spray (random position variation)
        let finalPosition = position;
        if (spray > 0) {
            finalPosition += (Math.random() * 2 - 1) * spray;
            finalPosition = Math.max(0, Math.min(1, finalPosition));
        }
        
        // Skip silence using RMS map if available
        if (useRmsMap && trackData.rmsMap && trackData.rmsMap.length > 0) {
            finalPosition = this.findActivePosition(finalPosition, trackData.rmsMap);
        }
        
        // Initialize voice
        voice.active = true;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = finalPosition;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor(grainSize * sampleRate)); // Minimum 128 samples
        voice.pitch = Math.max(0.05, Math.min(8.0, pitch)); // Updated Limits
        voice.velocity = Math.max(0, Math.min(2.0, velocity));
        voice.startFrame = this.currentFrame;
        voice.trackId = trackId;
        
        // Reset Release State for new grain
        voice.releasing = false;
        voice.releaseAmp = 1.0;
        
        this.totalGrainsTriggered++;
    }
    
    findActivePosition(requestedPos, rmsMap) {
        if (!rmsMap || rmsMap.length === 0) return requestedPos;
        
        const mapIdx = Math.floor(requestedPos * (rmsMap.length - 1));
        
        // If current position has audio, use it
        if (rmsMap[mapIdx]) return requestedPos;
        
        // Search for nearest non-silent position
        for (let i = 1; i < 50; i++) {
            // Check forward
            const forwardIdx = Math.min(mapIdx + i, rmsMap.length - 1);
            if (rmsMap[forwardIdx]) {
                return forwardIdx / (rmsMap.length - 1);
            }
            
            // Check backward
            const backwardIdx = Math.max(mapIdx - i, 0);
            if (rmsMap[backwardIdx]) {
                return backwardIdx / (rmsMap.length - 1);
            }
        }
        
        // No active position found, return original
        return requestedPos;
    }
    
    setBuffer(trackId, buffer, rmsMap = null) {
        // Convert rmsMap from numbers to booleans if needed
        let processedRmsMap = null;
        if (rmsMap && rmsMap.length > 0) {
            processedRmsMap = rmsMap.map(val => val > 0.01);
        }
        
        this.trackBuffers.set(trackId, {
            buffer: buffer,
            rmsMap: processedRmsMap
        });
        
        // Send confirmation back to main thread
        this.port.postMessage({
            type: 'bufferLoaded',
            trackId,
            bufferLength: buffer.length,
            hasRmsMap: !!processedRmsMap
        });
    }
    
    updateBuffer(trackId, buffer, rmsMap = null) {
        // Same as setBuffer but used for updates
        this.setBuffer(trackId, buffer, rmsMap);
    }
    
    stopAllVoices() {
        for (let v = 0; v < this.voices.length; v++) {
            // Phase 1.3: Soft Stop
            if (this.voices[v].active) {
                this.voices[v].releasing = true;
                this.voices[v].releaseAmp = 1.0;
            }
        }
    }
    
    stopTrack(trackId) {
        for (let v = 0; v < this.voices.length; v++) {
            // Phase 1.3: Soft Stop for specific track
            if (this.voices[v].trackId === trackId && this.voices[v].active) {
                this.activeNotes = this.activeNotes.filter(n => n.trackId !== trackId); // Stop scheduler
                this.voices[v].releasing = true;
                this.voices[v].releaseAmp = 1.0;
            }
        }
    }
    
    sendStats() {
        const activeVoices = this.voices.filter(v => v.active).length;
        const loadedBuffers = this.trackBuffers.size;
        
        this.port.postMessage({
            type: 'stats',
            data: {
                activeVoices,
                maxVoices: this.MAX_VOICES,
                loadedBuffers,
                totalGrainsTriggered: this.totalGrainsTriggered,
                currentFrame: this.currentFrame
            }
        });
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);