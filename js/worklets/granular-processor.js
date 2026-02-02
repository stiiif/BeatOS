// BeatOS Granular Synthesis AudioWorklet Processor
// Runs on dedicated audio rendering thread for ultra-low latency
// Supports: polyphonic grains, pitch shifting, RMS-based position finding, velocity
// Phase 1 Improvements: Cubic Interpolation, Window LUT, De-clicking
// Phase 2 Improvements: Event-Based Internal Scheduling & Universal DSP Engine

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

        // Sequencer State (Phase 2.2)
        this.sequencer = {
            playing: false,
            currentStep: 0,
            samplesPerStep: 0,
            sampleCounter: 0,
            steps: [], // 2D Array: [trackId][stepIndex] = velocity
            bpm: 120,
            trackParams: new Map() // trackId -> params object
        };

        // Drum Synth State (Phase 2.1)
        // Active drum voices (simple-drum engine)
        // We use a separate pool or just a simple array since drums are monophonic per track usually,
        // but let's allow basic overlap.
        this.drumVoices = []; 

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
                case 'syncSequencer': // Phase 2.2: Receive full grid state
                    this.syncSequencer(data);
                    break;

                case 'transport': // Phase 2.2: Start/Stop
                    this.handleTransport(data);
                    break;

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
                    this.drumVoices = [];
                    this.sequencer.playing = false;
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

    // Phase 2.2: Sync Sequencer Data
    syncSequencer(data) {
        if (data.bpm) this.sequencer.bpm = data.bpm;
        if (data.steps) this.sequencer.steps = data.steps;
        if (data.trackParams) {
            // trackParams is array of {id, type, params}
            data.trackParams.forEach(t => {
                this.sequencer.trackParams.set(t.id, t);
            });
        }
        this.calculateTiming();
    }

    handleTransport(data) {
        if (data.action === 'start') {
            this.sequencer.playing = true;
            this.sequencer.currentStep = 0;
            this.sequencer.sampleCounter = 0;
            this.calculateTiming();
        } else if (data.action === 'stop') {
            this.sequencer.playing = false;
            this.stopAllVoices();
            this.drumVoices = [];
        }
    }

    calculateTiming() {
        // 1 minute = 60 seconds
        // Beats per second = BPM / 60
        // Steps per second (16th notes) = (BPM / 60) * 4
        // Samples per step = sampleRate / stepsPerSecond
        const stepsPerSecond = (this.sequencer.bpm / 60) * 4;
        this.sequencer.samplesPerStep = sampleRate / stepsPerSecond;
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
        
        // Check track type
        const trackInfo = this.sequencer.trackParams.get(trackId);
        const type = trackInfo ? trackInfo.type : 'granular';

        if (type === 'simple-drum') {
            // Trigger Synthesis
            this.triggerDrumSynth(trackId, params);
        } else {
            // Trigger Granular Scheduler
            this.activeNotes.push({
                trackId,
                startTime: time, // Now unused if sequencer drives it, but kept for compatibility
                duration: duration, 
                params: params, 
                nextGrainTime: currentTime // Immediate
            });
        }
    }

    // Phase 2.1: Drum Synthesis DSP
    triggerDrumSynth(trackId, params) {
        const trackInfo = this.sequencer.trackParams.get(trackId);
        const drumType = trackInfo?.params?.drumType || 'kick';
        const tune = trackInfo?.params?.drumTune || 0.5;
        const decay = trackInfo?.params?.drumDecay || 0.5;
        
        // Velocity logic
        let gain = params.velocity || 1.0;
        
        // Create voice
        const voice = {
            active: true,
            trackId: trackId,
            type: drumType,
            phase: 0,
            sampleRate: sampleRate,
            params: { tune, decay, gain }
        };
        
        this.drumVoices.push(voice);
    }

    // DSP: Generate Kick
    generateKick(voice) {
        const t = voice.phase / sampleRate;
        const { tune, decay, gain } = voice.params;
        
        // Frequency Envelope (Sweep)
        const startFreq = 150 + (tune * 200);
        const endFreq = 50 + (tune * 100);
        const sweepDecay = 0.01 + (decay * 0.1);
        const currentFreq = startFreq * Math.exp(-t / sweepDecay) + endFreq;
        
        // Amp Envelope
        const ampDecay = 0.1 + (decay * 0.5);
        const amp = Math.exp(-t / ampDecay);
        
        // Oscillator
        const osc = Math.sin(voice.phase * 2 * Math.PI * currentFreq / sampleRate);
        
        if (amp < 0.001) voice.active = false;
        
        return osc * amp * gain;
    }

    // DSP: Generate Snare
    generateSnare(voice) {
        const t = voice.phase / sampleRate;
        const { tune, decay, gain } = voice.params;
        
        // Tone (Body)
        const toneFreq = 180 + (tune * 100);
        const toneDecay = 0.1 + (decay * 0.1);
        const toneAmp = Math.exp(-t / toneDecay);
        const tone = Math.sin(voice.phase * 2 * Math.PI * toneFreq / sampleRate);
        
        // Noise (Wires)
        const noiseDecay = 0.05 + (decay * 0.3);
        const noiseAmp = Math.exp(-t / noiseDecay);
        const noise = (Math.random() * 2 - 1);
        
        if (noiseAmp < 0.001 && toneAmp < 0.001) voice.active = false;
        
        return ((tone * toneAmp * 0.5) + (noise * noiseAmp * 0.5)) * gain;
    }

    // DSP: Generate Hat
    generateHat(voice) {
        const t = voice.phase / sampleRate;
        const { tune, decay, gain } = voice.params;
        
        // Bandpass Noise
        const noise = (Math.random() * 2 - 1);
        // Simple Highpass (Differential)
        // y[n] = x[n] - x[n-1]
        // Not stateful here for simplicity, raw noise is bright enough
        
        const hatDecay = 0.05 + (decay * 0.2); // Short
        const amp = Math.exp(-t / hatDecay);
        
        if (amp < 0.001) voice.active = false;
        
        return noise * amp * gain;
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        // If outputs is empty, we can't do anything
        if (!output || output.length === 0) return true;

        const frameCount = output[0].length;
        const now = currentTime; 
        
        // --- 1. Sequencer Clock Logic (Phase 2.2) ---
        if (this.sequencer.playing) {
            for (let i = 0; i < frameCount; i++) {
                this.sequencer.sampleCounter++;
                if (this.sequencer.sampleCounter >= this.sequencer.samplesPerStep) {
                    this.sequencer.sampleCounter = 0;
                    
                    // Trigger Step
                    const stepIdx = this.sequencer.currentStep;
                    
                    // Iterate all tracks in grid
                    if (this.sequencer.steps && this.sequencer.steps.length > 0) {
                        this.sequencer.steps.forEach((trackSteps, trackId) => {
                            if (!trackSteps) return;
                            const velocity = trackSteps[stepIdx];
                            if (velocity > 0) {
                                // Trigger Logic
                                const info = this.sequencer.trackParams.get(trackId);
                                if (info) {
                                    // Convert velocity 1-3 to gain
                                    // 1=0.4, 2=0.75, 3=1.0
                                    let velGain = 0.75;
                                    if (velocity === 1) velGain = 0.4;
                                    if (velocity === 3) velGain = 1.0;

                                    if (info.type === 'simple-drum') {
                                        this.triggerDrumSynth(trackId, { velocity: velGain });
                                    } else {
                                        // Granular Trigger
                                        // We need 'params' which usually comes from NoteOn
                                        // For internal sequencer, we use the stored static params
                                        // NOTE: LFOs are calculated in Main Thread. 
                                        // For pure worklet sequencer, we use base params.
                                        this.activeNotes.push({
                                            trackId,
                                            startTime: now,
                                            duration: info.params.relGrain || 0.5,
                                            params: { ...info.params, velocity: velGain },
                                            nextGrainTime: now
                                        });
                                    }
                                }
                            }
                        });
                    }

                    // Advance Step
                    // Assuming 32 steps for now, or use steps.length
                    // We'll use a fixed loop length or dynamic. 
                    // Let's assume standard 32 for BeatOS.
                    this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 32;
                    
                    // Notify Main Thread (for UI)
                    this.port.postMessage({ type: 'tick', step: stepIdx });
                }
            }
        }

        // --- 2. Granular Scheduler (for Granular Tracks) ---
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

                // Spawn grains
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

        // Clear output buffers
        // We have multiple outputs (one per track), we must clear all
        for (let j = 0; j < outputs.length; j++) {
            const out = outputs[j];
            if(out) {
                for (let ch = 0; ch < out.length; ch++) out[ch].fill(0);
            }
        }
        
        // --- 3. Process Granular Voices ---
        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            
            // Get correct output for this track
            const trackOut = outputs[voice.trackId];
            if (!trackOut) continue; // Track not connected or invalid

            // Generate samples for this grain
            for (let i = 0; i < frameCount; i++) {
                // De-clicking
                if (voice.releasing) {
                    voice.releaseAmp -= (1.0 / 64.0); 
                    if (voice.releaseAmp <= 0) {
                        voice.active = false; voice.releasing = false; break; 
                    }
                }

                if (voice.phase >= voice.grainLength) {
                    voice.active = false; break;
                }
                
                // Buffer Read
                const baseReadPos = voice.position * voice.bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                
                const wrappedPos = readPos % voice.bufferLength;
                const sampleIndex = Math.floor(wrappedPos);
                const frac = wrappedPos - sampleIndex;

                // Cubic Interpolation
                const idx0 = (sampleIndex - 1 + voice.bufferLength) % voice.bufferLength;
                const idx1 = sampleIndex;
                const idx2 = (sampleIndex + 1) % voice.bufferLength;
                const idx3 = (sampleIndex + 2) % voice.bufferLength;

                const y0 = voice.buffer[idx0] || 0;
                const y1 = voice.buffer[idx1] || 0;
                const y2 = voice.buffer[idx2] || 0;
                const y3 = voice.buffer[idx3] || 0;

                const sample = this.cubicHermite(y0, y1, y2, y3, frac);
                
                // Envelope
                const lutIndex = Math.floor((voice.phase / voice.grainLength) * 4095);
                const safeLutIndex = Math.max(0, Math.min(4095, lutIndex));
                const envelope = this.windowLUT[safeLutIndex];
                
                const outputSample = sample * envelope * voice.velocity * voice.releaseAmp;
                
                // Mix to Track Output
                trackOut[0][i] += outputSample;
                if (trackOut.length > 1) trackOut[1][i] += outputSample;
                
                voice.phase++;
            }
        }

        // --- 4. Process Drum Voices (DSP) ---
        for (let i = this.drumVoices.length - 1; i >= 0; i--) {
            const voice = this.drumVoices[i];
            if (!voice.active) {
                this.drumVoices.splice(i, 1);
                continue;
            }

            const trackOut = outputs[voice.trackId];
            if (!trackOut) continue;

            for (let f = 0; f < frameCount; f++) {
                let sample = 0;
                if (voice.type === 'kick') sample = this.generateKick(voice);
                else if (voice.type === 'snare') sample = this.generateSnare(voice);
                else if (voice.type === 'closed-hat' || voice.type === 'open-hat') sample = this.generateHat(voice);
                else if (voice.type === 'cymbal') sample = this.generateHat(voice); // Reuse hat for now
                
                trackOut[0][f] += sample;
                if (trackOut.length > 1) trackOut[1][f] += sample;
                
                voice.phase++;
            }
        }
        
        // --- 5. Soft Limiter (Per Track) ---
        // Prevents clipping before main thread mixer
        const outputGain = 0.5;
        for (let j = 0; j < outputs.length; j++) {
            const out = outputs[j];
            if (!out) continue;
            for (let channel = 0; channel < out.length; channel++) {
                for (let i = 0; i < frameCount; i++) {
                    const sample = out[channel][i] * outputGain;
                    // Fast tanh approximation
                    const x = Math.max(-3, Math.min(3, sample));
                    out[channel][i] = x * (27 + x * x) / (27 + 9 * x * x);
                }
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
            voice.releasing = true; 
        }

        let finalPos = params.position;
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
        
        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            voice = this.voices.reduce((oldest, v) => 
                v.startFrame < oldest.startFrame ? v : oldest
            );
        }
        
        let finalPosition = position;
        if (spray > 0) {
            finalPosition += (Math.random() * 2 - 1) * spray;
            finalPosition = Math.max(0, Math.min(1, finalPosition));
        }
        
        if (useRmsMap && trackData.rmsMap && trackData.rmsMap.length > 0) {
            finalPosition = this.findActivePosition(finalPosition, trackData.rmsMap);
        }
        
        voice.active = true;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = finalPosition;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor(grainSize * sampleRate)); 
        voice.pitch = Math.max(0.05, Math.min(8.0, pitch)); 
        voice.velocity = Math.max(0, Math.min(2.0, velocity));
        voice.startFrame = this.currentFrame;
        voice.trackId = trackId;
        voice.releasing = false;
        voice.releaseAmp = 1.0;
        
        this.totalGrainsTriggered++;
    }
    
    findActivePosition(requestedPos, rmsMap) {
        if (!rmsMap || rmsMap.length === 0) return requestedPos;
        const mapIdx = Math.floor(requestedPos * (rmsMap.length - 1));
        if (rmsMap[mapIdx]) return requestedPos;
        for (let i = 1; i < 50; i++) {
            const forwardIdx = Math.min(mapIdx + i, rmsMap.length - 1);
            if (rmsMap[forwardIdx]) {
                return forwardIdx / (rmsMap.length - 1);
            }
            const backwardIdx = Math.max(mapIdx - i, 0);
            if (rmsMap[backwardIdx]) {
                return backwardIdx / (rmsMap.length - 1);
            }
        }
        return requestedPos;
    }
    
    setBuffer(trackId, buffer, rmsMap = null) {
        let processedRmsMap = null;
        if (rmsMap && rmsMap.length > 0) {
            processedRmsMap = rmsMap.map(val => val > 0.01);
        }
        this.trackBuffers.set(trackId, {
            buffer: buffer,
            rmsMap: processedRmsMap
        });
        this.port.postMessage({
            type: 'bufferLoaded',
            trackId,
            bufferLength: buffer.length,
            hasRmsMap: !!processedRmsMap
        });
    }
    
    updateBuffer(trackId, buffer, rmsMap = null) {
        this.setBuffer(trackId, buffer, rmsMap);
    }
    
    stopAllVoices() {
        for (let v = 0; v < this.voices.length; v++) {
            if (this.voices[v].active) {
                this.voices[v].releasing = true;
                this.voices[v].releaseAmp = 1.0;
            }
        }
    }
    
    stopTrack(trackId) {
        for (let v = 0; v < this.voices.length; v++) {
            if (this.voices[v].trackId === trackId && this.voices[v].active) {
                this.activeNotes = this.activeNotes.filter(n => n.trackId !== trackId); 
                this.voices[v].releasing = true;
                this.voices[v].releaseAmp = 1.0;
            }
        }
        // Also stop drum voices for this track
        this.drumVoices = this.drumVoices.filter(v => v.trackId !== trackId);
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