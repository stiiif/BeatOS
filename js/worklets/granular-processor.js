// BeatOS Granular Synthesis AudioWorklet Processor
// Runs on dedicated audio rendering thread for ultra-low latency
// Supports: polyphonic grains, pitch shifting, RMS-based position finding, velocity
// Phase 1: Cubic Interpolation, Window LUT, De-clicking
// Phase 2: Event-Based Internal Scheduling
// Phase 4: AudioWorklet Sequencer (The Gold Standard)

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // --- Voice Pool ---
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
        
        // --- Internal Schedulers ---
        this.activeNotes = []; // For granular clouds (duration based)
        
        // --- Sequencer State (Phase 4) ---
        this.sequencer = {
            playing: false,
            bpm: 120,
            currentStep: -1,        // 0-63 (assuming 64 steps max)
            samplesPerStep: 0,      // Calculated based on BPM
            accumulatedSamples: 0,  // Sample counter for the current step
            totalSamples: 0         // Global transport time
        };
        
        // Track Data Storage (Patterns)
        // Map<trackId, { steps: Uint8Array, microtiming: Float32Array, params: Object }>
        this.tracksData = new Map(); 
        
        // Queue for events scheduled within the current block or near future
        // { triggerTime: number (in frames), trackId: number, velocity: number }
        this.pendingTriggers = []; 

        // --- Buffers ---
        this.trackBuffers = new Map();
        
        // --- Stats ---
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;

        // --- DSP LUTs ---
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            const phase = i / 4095;
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        
        // --- Message Handling ---
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            
            switch(type) {
                // Transport Control
                case 'transport:start':
                    this.sequencer.playing = true;
                    this.sequencer.currentStep = -1;
                    this.sequencer.accumulatedSamples = this.sequencer.samplesPerStep; // Force immediate trigger
                    break;
                case 'transport:stop':
                    this.sequencer.playing = false;
                    this.activeNotes = [];
                    this.stopAllVoices();
                    break;
                case 'setBPM':
                    this.sequencer.bpm = data;
                    this.updateTimingConstants();
                    break;
                
                // Pattern Data
                case 'updatePattern':
                    {
                        const current = this.tracksData.get(data.trackId) || {};
                        this.tracksData.set(data.trackId, {
                            ...current,
                            steps: data.steps,
                            microtiming: data.microtiming
                        });
                    }
                    break;

                // Parameter Data (CRITICAL: Syncing params to Worklet)
                case 'updateParams':
                    {
                        const current = this.tracksData.get(data.trackId) || {};
                        this.tracksData.set(data.trackId, {
                            ...current,
                            params: data.params
                        });
                    }
                    break;

                // Legacy/Direct Control
                case 'trigger': 
                    this.triggerGrain(data); 
                    break;
                case 'noteOn': 
                    // Direct NoteOn (still useful for previewing sounds)
                    this.handleNoteOn(data); 
                    break;
                    
                // Buffer Management
                case 'setBuffer':
                    this.setBuffer(data.trackId, data.buffer, data.rmsMap);
                    break;
                case 'updateBuffer':
                    this.updateBuffer(data.trackId, data.buffer, data.rmsMap);
                    break;
                case 'stopAll':
                    this.stopAllVoices();
                    this.activeNotes = [];
                    break;
                case 'stopTrack':
                    this.stopTrack(data.trackId);
                    break;
                case 'getStats':
                    this.sendStats();
                    break;
            }
        };
        
        this.updateTimingConstants();
    }

    updateTimingConstants() {
        // 16th note duration = (60 / BPM) / 4
        const stepDurationSeconds = (60 / (this.sequencer.bpm || 120)) / 4;
        this.sequencer.samplesPerStep = stepDurationSeconds * sampleRate;
    }

    cubicHermite(y0, y1, y2, y3, x) {
        const c0 = y1;
        const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
        return ((c3 * x + c2) * x + c1) * x + c0;
    }
    
    handleNoteOn(data) {
        // Direct NoteOn handling (for preview/manual triggers)
        this.activeNotes.push({
            trackId: data.trackId,
            startTime: data.time, // Absolute frame time or relative 'now' logic handled in process
            duration: data.duration,
            params: data.params,
            nextGrainTime: data.time // Start grains immediately
        });
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;
        
        // Global time in seconds
        const now = currentTime; 
        
        // --- 1. ADVANCE SEQUENCER ---
        if (this.sequencer.playing) {
            // How many samples we process in this block
            let samplesToProcess = frameCount;
            let blockOffset = 0;

            // We iterate through the block to handle sample-accurate step transitions
            while (this.sequencer.accumulatedSamples + samplesToProcess >= this.sequencer.samplesPerStep) {
                // Calculate frames until the next step
                const framesUntilStep = Math.floor(this.sequencer.samplesPerStep - this.sequencer.accumulatedSamples);
                
                // Advance the accumulated counter to the step boundary
                this.sequencer.accumulatedSamples += framesUntilStep;
                samplesToProcess -= framesUntilStep;
                blockOffset += framesUntilStep; // Offset within the current audio block

                // --- TRIGGER NEXT STEP ---
                this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 64; // Hardcoded 64 steps for now
                this.sequencer.accumulatedSamples = 0; // Reset counter for new step
                
                // Notify Main Thread for Visuals (Low Priority)
                this.port.postMessage({ type: 'step', step: this.sequencer.currentStep });

                // Schedule Tracks for this Step
                this.scheduleTracksForStep(this.sequencer.currentStep, this.currentFrame + blockOffset);
            }
            
            // Add remaining samples in this block
            this.sequencer.accumulatedSamples += samplesToProcess;
        }

        // --- 2. EXECUTE PENDING TRIGGERS ---
        // Events in pendingTriggers have a precise `triggerTime` (in frames)
        for (let i = this.pendingTriggers.length - 1; i >= 0; i--) {
            const trigger = this.pendingTriggers[i];
            
            // Check if trigger time is within this block (or past due)
            if (trigger.triggerTime < this.currentFrame + frameCount) {
                
                // Send trigger message back to main thread (for 909/Hybrid)
                this.port.postMessage({ 
                    type: 'triggerExternal', 
                    trackId: trigger.trackId, 
                    velocity: trigger.velocity,
                    time: currentTime // timestamp for main thread reference
                });

                // Get Track Params from local store
                const trackInfo = this.tracksData.get(trigger.trackId);
                const p = trackInfo && trackInfo.params ? trackInfo.params : {};
                
                // Construct Note Params from Track State
                // Defaults if params missing
                const density = p.density || 20;
                const grainSize = p.grainSize || 0.1;
                const overlap = p.overlap || 0;
                const pitch = p.pitch || 1.0;
                const spray = p.spray || 0;
                const position = p.position !== undefined ? p.position : 0.5;
                const relGrain = p.relGrain !== undefined ? p.relGrain : 0.4;

                // Schedule granular note
                this.handleNoteOn({
                    trackId: trigger.trackId,
                    time: trigger.triggerTime / sampleRate, // Convert frame to seconds for note scheduler
                    duration: relGrain, 
                    params: {
                        position: position,
                        velocity: trigger.velocity, // Passed from step data
                        density: density,
                        grainSize: grainSize,
                        overlap: overlap,
                        pitch: pitch,
                        spray: spray
                    }
                });

                // Remove processed trigger
                this.pendingTriggers.splice(i, 1);
            }
        }

        // --- 3. GRANULAR SCHEDULER (Phase 2 Logic) ---
        // Manages active notes and spawns grains
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            if (now >= note.startTime) {
                let density = Math.max(1, note.params.density || 20);
                let interval = 1 / density;
                
                // Density/Overlap Logic
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }

                let grainsSpawnedThisBlock = 0;
                // Lookahead: Spawn grains if their time is within this block
                const blockEndTime = now + (frameCount / sampleRate);
                
                while (note.nextGrainTime < blockEndTime && grainsSpawnedThisBlock < 10) {
                    if (note.nextGrainTime >= now) {
                        this.spawnGrainFromNote(note);
                    }
                    note.nextGrainTime += interval;
                    grainsSpawnedThisBlock++;
                }
            }
        }

        if (channelCount === 0) return true;
        
        // --- 4. RENDER AUDIO (Phase 1 Logic) ---
        for (let channel = 0; channel < channelCount; channel++) {
            output[channel].fill(0);
        }
        
        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) continue; // Routing check

            for (let i = 0; i < frameCount; i++) {
                if (voice.releasing) {
                    voice.releaseAmp -= (1.0 / 64.0);
                    if (voice.releaseAmp <= 0) {
                        voice.active = false;
                        voice.releasing = false;
                        break;
                    }
                }

                if (voice.phase >= voice.grainLength) {
                    voice.active = false;
                    break;
                }
                
                const baseReadPos = voice.position * voice.bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                const wrappedPos = readPos % voice.bufferLength;
                const sampleIndex = Math.floor(wrappedPos);
                const frac = wrappedPos - sampleIndex;

                const idx0 = (sampleIndex - 1 + voice.bufferLength) % voice.bufferLength;
                const idx1 = sampleIndex;
                const idx2 = (sampleIndex + 1) % voice.bufferLength;
                const idx3 = (sampleIndex + 2) % voice.bufferLength;

                const y0 = voice.buffer[idx0] || 0;
                const y1 = voice.buffer[idx1] || 0;
                const y2 = voice.buffer[idx2] || 0;
                const y3 = voice.buffer[idx3] || 0;

                const sample = this.cubicHermite(y0, y1, y2, y3, frac);
                
                const lutIndex = Math.floor((voice.phase / voice.grainLength) * 4095);
                const safeLutIndex = Math.max(0, Math.min(4095, lutIndex));
                const envelope = this.windowLUT[safeLutIndex];
                
                const outputSample = sample * envelope * voice.velocity * voice.releaseAmp;
                
                trackOutput[0][i] += outputSample;
                if (trackOutput.length > 1) {
                    trackOutput[1][i] += outputSample;
                }
                
                voice.phase++;
            }
        }
        
        // Soft Limiter
        const outputGain = 0.5;
        for (let j = 0; j < outputs.length; j++) {
            const out = outputs[j];
            if (!out) continue;
            for (let channel = 0; channel < out.length; channel++) {
                for (let i = 0; i < frameCount; i++) {
                    const sample = out[channel][i] * outputGain;
                    const x = Math.max(-3, Math.min(3, sample));
                    out[channel][i] = x * (27 + x * x) / (27 + 9 * x * x);
                }
            }
        }
        
        this.currentFrame += frameCount;
        return true;
    }
    
    // Internal Helper: Schedules triggers for a specific step
    scheduleTracksForStep(stepIndex, triggerFrameTime) {
        this.tracksData.forEach((data, trackId) => {
            if (!data.steps) return;
            const velocity = data.steps[stepIndex];
            
            if (velocity > 0) {
                // Calculate Delay (Microtiming)
                const microtimingMs = data.microtiming ? data.microtiming[stepIndex] : 0;
                const delayFrames = Math.floor((microtimingMs / 1000) * sampleRate);
                
                const actualTriggerTime = triggerFrameTime + delayFrames;
                
                this.pendingTriggers.push({
                    triggerTime: actualTriggerTime,
                    trackId: trackId,
                    velocity: velocity
                });
            }
        });
    }

    spawnGrainFromNote(note) {
        const { params } = note;
        const trackData = this.trackBuffers.get(note.trackId);
        
        if (!trackData || !trackData.buffer) return;

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

        voice.active = true;
        voice.trackId = note.trackId;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = finalPos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor((params.grainSize || 0.1) * sampleRate));
        voice.pitch = Math.max(0.05, Math.min(8.0, params.pitch || 1.0));
        
        // Velocity Scaling (1=Ghost, 2=Normal, 3=Accent)
        let velMult = 0.75;
        if (params.velocity === 1) velMult = 0.4;
        else if (params.velocity === 3) velMult = 1.0;
        
        voice.velocity = velMult;
        voice.startFrame = this.currentFrame;
        voice.releasing = false;
        voice.releaseAmp = 1.0;

        this.totalGrainsTriggered++;
    }
    
    // ... Legacy / Helper Methods ...
    triggerGrain(data) { 
        this.handleNoteOn({
            trackId: data.trackId,
            time: currentTime,
            duration: data.grainSize,
            params: { ...data, density: 1, overlap: 0 }
        });
    }
    
    findActivePosition(requestedPos, rmsMap) { return requestedPos; }
    
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
        this.activeNotes = this.activeNotes.filter(n => n.trackId !== trackId);
        for (let v = 0; v < this.voices.length; v++) {
            if (this.voices[v].trackId === trackId && this.voices[v].active) {
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