/**
 * WASM-POWERED GRANULAR PROCESSOR (MULTI-TRACK ROUTING)
 * With Debugging Support & Heap Safety
 * + Legacy JS Fallback Mode for A/B Testing
 */
class WasmGranularProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.wasmInstance = null;
        this.memory = null;
        
        // Pointers will be fetched from WASM
        this.PTR_OUTPUT_START = 0;
        
        // Track loaded buffers to prevent spawning on empty tracks
        this.loadedTracks = new Set();
        this.trackBuffers = new Map(); // Store buffers for JS mode
        
        // Active Notes for Density Scheduling
        this.activeNotes = [];
        
        // Mode Switching
        this.useWasm = true; // Default to WASM
        this.debugDensity = false; // Toggle for verbose logging

        // --- LEGACY JS STATE ---
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0
        }));
        this.activeVoiceIndices = [];
        this.windowLUT = new Float32Array(4096);
        this.initJsLut();
        this.currentFrame = 0;
        // -----------------------
        
        // Load WASM from options
        if (options.processorOptions && options.processorOptions.wasmBytes) {
            this.initWasm(options.processorOptions.wasmBytes);
        } else {
            console.error("WasmGranularProcessor: No wasmBytes provided in options");
        }
        
        this.port.onmessage = (e) => {
            if (e.data.type === 'noteOn') {
                this.handleNoteOn(e.data.data);
            } else if (e.data.type === 'setBuffer') {
                const payload = e.data.data;
                this.loadBuffer(payload.trackId, payload.buffer);
            } else if (e.data.type === 'setProcessorMode') {
                this.useWasm = !!e.data.useWasm;
                console.log(`[Processor] Switched to ${this.useWasm ? 'WASM' : 'JS (Legacy)'} mode`);
            } else if (e.data.type === 'setDebugDensity') {
                this.debugDensity = !!e.data.debug;
                console.log(`[Processor] Density Debugging: ${this.debugDensity ? 'ON' : 'OFF'}`);
            }
        };
    }

    initJsLut() {
        const alpha = 0.5;
        for(let i=0; i<4096; i++) {
            const p = i / 4095;
            if (p < alpha / 2) this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 1)));
            else if (p > 1 - alpha / 2) this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 2 / alpha + 1)));
            else this.windowLUT[i] = 1.0;
        }
    }

    async initWasm(bytes) {
        try {
            const result = await WebAssembly.instantiate(bytes, {
                env: {
                    abort: () => console.error("Wasm abort!"),
                    consoleLogf: (val) => console.log("AS [f32]:", val),
                    consoleLogi: (val) => console.log("AS [i32]:", val),
                }
            });
            this.wasmInstance = result.instance;
            this.memory = this.wasmInstance.exports.memory;
            
            // Initialize WASM
            this.wasmInstance.exports.init();
            
            // Get the dynamic output pointer
            if (this.wasmInstance.exports.getOutputBufferPtr) {
                this.PTR_OUTPUT_START = this.wasmInstance.exports.getOutputBufferPtr();
            } else {
                console.warn("Wasm export getOutputBufferPtr missing, assuming 0 (Risk of heap collision)");
                this.PTR_OUTPUT_START = 0;
            }

            console.log(`Wasm DSP Initialized. Output Ptr: ${this.PTR_OUTPUT_START}`);
        } catch (e) {
            console.error("Wasm instantiation failed", e);
        }
    }

    loadBuffer(trackId, float32Data) {
        // Always store in JS Map for Legacy Mode
        this.trackBuffers.set(trackId, float32Data);

        if (!this.wasmInstance) return;
        
        try {
            // Check if data is valid
            if (!float32Data || !float32Data.length) {
                console.error(`[WasmProcessor] Invalid buffer data for track ${trackId}`);
                return;
            }

            const ptr = this.wasmInstance.exports.allocateBuffer(trackId, float32Data.length);
            
            if (ptr + (float32Data.length * 4) > this.memory.buffer.byteLength) {
                console.error(`[WasmProcessor] Memory overflow! Needed ${ptr + float32Data.length * 4}, have ${this.memory.buffer.byteLength}`);
                return;
            }

            const wasmArray = new Float32Array(this.memory.buffer, ptr, float32Data.length);
            wasmArray.set(float32Data);
            
            this.loadedTracks.add(trackId);
        } catch(e) {
            console.error(`[WasmProcessor] Error loading buffer for track ${trackId}:`, e);
        }
    }

    handleNoteOn(data) {
        this.activeNotes.push({
            trackId: data.trackId,
            startTime: data.time,
            duration: data.duration,
            params: data.params,
            nextGrainTime: data.time
        });
    }

    // --- LEGACY JS SPAWN ---
    spawnGrainJs(note) {
        const buffer = this.trackBuffers.get(note.trackId);
        if (!buffer) return;

        let voice = null;
        for (let i = 0; i < this.MAX_VOICES; i++) {
            if (!this.voices[i].active) {
                voice = this.voices[i];
                this.activeVoiceIndices.push(i);
                break;
            }
        }
        
        // Simple stealing (if full, steal oldest/releasing)
        if (!voice && this.activeVoiceIndices.length > 0) {
             const stealIdx = this.activeVoiceIndices[0]; // Just steal first for simplicity in fallback
             voice = this.voices[stealIdx];
             // In full impl we'd check releasing, but this is fallback
        }

        if (!voice) return;

        const p = note.params;
        let pos = p.position;
        // Basic spray (simplified)
        if (p.spray > 0) pos += (Math.random() * 2 - 1) * p.spray;
        if (pos < 0) pos = 0; if (pos > 1) pos = 1;

        const sampleRate = 44100; // Fixed for Worklet context
        const gLen = Math.floor((p.grainSize || 0.1) * sampleRate);

        voice.active = true;
        voice.trackId = note.trackId;
        voice.buffer = buffer;
        voice.bufferLength = buffer.length;
        voice.position = pos;
        voice.phase = 0;
        voice.grainLength = Math.max(128, gLen);
        voice.invGrainLength = 4095 / voice.grainLength;
        voice.pitch = p.pitch || 1.0;
        voice.velocity = p.velocity || 1.0;
        voice.releasing = false;
        voice.releaseAmp = 1.0;
        
        if (this.debugDensity) {
             console.log(`[JS] Spawned grain. Density: ${p.density} Interval: ${(1/p.density).toFixed(4)}`);
        }
    }

    spawnGrain(note) {
        if (this.useWasm) {
            if (!this.wasmInstance) return;
            if (typeof note.trackId !== 'number' || note.trackId < 0 || note.trackId >= 32) return;
            if (!this.loadedTracks.has(note.trackId)) return;

            const p = note.params;
            this.wasmInstance.exports.spawnGrain(
                note.trackId,
                p.position,
                p.grainSize,
                p.pitch,
                p.velocity || 1.0,
                p.spray,
                sampleRate
            );
            
            if (this.debugDensity) {
                 console.log(`[WASM] Spawned grain. Density: ${p.density} Interval: ${(1/p.density).toFixed(4)}`);
            }
        } else {
            this.spawnGrainJs(note);
        }
    }

    process(inputs, outputs, parameters) {
        const currentTime = globalThis.currentTime;
        const frameCount = outputs[0][0].length; // usually 128

        // --- SCHEDULER (Shared) ---
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (currentTime > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            if (currentTime >= note.startTime) {
                let density = note.params.density || 20;
                if (density < 1) density = 1;
                let interval = 1 / density;
                
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    const overlapInterval = grainDur / Math.max(0.1, note.params.overlap);
                    interval = overlapInterval;
                }

                let spawnLimit = 10; 
                const lookahead = frameCount / sampleRate; 

                while (note.nextGrainTime < currentTime + lookahead && spawnLimit > 0) {
                    if (note.nextGrainTime >= currentTime) {
                        this.spawnGrain(note);
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        // --- DSP SWITCH ---
        if (this.useWasm) {
            this.processWasm(outputs, frameCount);
        } else {
            this.processJs(outputs, frameCount);
        }

        return true;
    }

    processWasm(outputs, frameCount) {
        if (!this.wasmInstance) return;

        try {
            this.wasmInstance.exports.process(sampleRate);
        } catch (e) {
            console.error("WASM Process Crashed:", e);
            this.wasmInstance = null; 
            return;
        }
        
        const blockSize = 128;
        const bytesPerBlock = blockSize * 4;
        const bytesPerTrack = bytesPerBlock * 2; 

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            if (!output || output.length === 0) continue;

            const trackOffsetBytes = this.PTR_OUTPUT_START + (i * bytesPerTrack);
            
            if (trackOffsetBytes + bytesPerTrack > this.memory.buffer.byteLength) break; 
            
            const leftData = new Float32Array(this.memory.buffer, trackOffsetBytes, blockSize);
            output[0].set(leftData);

            if (output.length > 1) {
                const rightData = new Float32Array(this.memory.buffer, trackOffsetBytes + bytesPerBlock, blockSize);
                output[1].set(rightData);
            }
        }
    }

    processJs(outputs, frameCount) {
        // Clear outputs first
        // (WASM does this internally, JS needs to do it here if we want to be safe, though Web Audio usually zeroes)
        
        // --- 2. DSP LOOP (JS) ---
        let j=0, readPos=0.0, idx=0, frac=0.0, sample=0.0, lutIdx=0, window=0.0, out=0.0;
        let i0=0, i1=0, i2=0, i3=0;
        let y0=0, y1=0, y2=0, y3=0;
        let c0=0, c1=0, c2=0, c3=0;

        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const voiceIdx = this.activeVoiceIndices[i];
            const voice = this.voices[voiceIdx];
            
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) {
                // Deactivate
                voice.active = false;
                const last = this.activeVoiceIndices.pop();
                if (i < this.activeVoiceIndices.length) this.activeVoiceIndices[i] = last;
                continue;
            }

            const leftChannel = trackOutput[0];
            const rightChannel = trackOutput[1];
            const buffer = voice.buffer;
            const bufferLen = voice.bufferLength;
            
            const pitch = voice.pitch;
            const grainLen = voice.grainLength;
            const velocity = voice.velocity;
            const invGrainLen = voice.invGrainLength;
            const startPos = voice.position * bufferLen;
            const useCubic = (pitch > 1.2 || pitch < 0.8);

            let phase = voice.phase;
            let releasing = voice.releasing;
            let relAmp = voice.releaseAmp;
            
            for (j = 0; j < frameCount; j++) {
                if (releasing) {
                    relAmp -= 0.015;
                    if (relAmp < 0.001) { 
                        voice.active = false;
                        break; 
                    }
                }

                if (phase >= grainLen) {
                    voice.active = false;
                    break;
                }
                
                readPos = startPos + (phase * pitch);
                idx = readPos | 0; 
                while (idx >= bufferLen) idx -= bufferLen;
                while (idx < 0) idx += bufferLen;
                frac = readPos - idx;

                if (useCubic) {
                    i1 = idx;
                    i0 = i1 - 1; if (i0 < 0) i0 += bufferLen;
                    i2 = i1 + 1; if (i2 >= bufferLen) i2 -= bufferLen;
                    i3 = i2 + 1; if (i3 >= bufferLen) i3 -= bufferLen;

                    y0 = buffer[i0]; y1 = buffer[i1]; y2 = buffer[i2]; y3 = buffer[i3];
                    c0 = y1;
                    c1 = 0.5 * (y2 - y0);
                    c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
                    c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
                    sample = ((c3 * frac + c2) * frac + c1) * frac + c0;
                } else {
                    i2 = idx + 1; if (i2 >= bufferLen) i2 = 0;
                    const s1 = buffer[idx]; const s2 = buffer[i2];
                    sample = s1 + frac * (s2 - s1);
                }
                
                lutIdx = (phase * invGrainLen) | 0;
                window = this.windowLUT[lutIdx] || 0;
                
                out = sample * window * velocity * relAmp;
                
                leftChannel[j] += out;
                if (rightChannel) rightChannel[j] += out;
                
                phase++;
            }
            
            // Clean up dead voices
            if (!voice.active) {
                 const last = this.activeVoiceIndices.pop();
                 if (i < this.activeVoiceIndices.length) this.activeVoiceIndices[i] = last;
            } else {
                voice.phase = phase;
                voice.releasing = releasing;
                voice.releaseAmp = relAmp;
            }
        }
    }
}

registerProcessor('wasm-granular-processor', WasmGranularProcessor);