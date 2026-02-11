/**
 * WASM-POWERED GRANULAR PROCESSOR (MULTI-TRACK ROUTING)
 * With Offset-Based Timing for High-Fidelity Density
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
        
        // Active Notes for Density Scheduling
        this.activeNotes = [];
        
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
            }
        };
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
        // We store the note to schedule grains over time
        this.activeNotes.push({
            trackId: data.trackId,
            startTime: data.time,
            duration: data.duration,
            params: data.params,
            nextGrainTime: data.time
        });
    }

    spawnGrain(note, offsetSamples = 0) {
        if (!this.wasmInstance) return;
        
        if (typeof note.trackId !== 'number' || note.trackId < 0 || note.trackId >= 32) {
            return;
        }
        
        if (!this.loadedTracks.has(note.trackId)) {
            return;
        }

        const p = note.params;
        this.wasmInstance.exports.spawnGrain(
            note.trackId,
            p.position,
            p.grainSize,
            p.pitch,
            p.velocity || 1.0,
            p.spray,
            sampleRate,
            offsetSamples // Pass the calculated offset to WASM
        );
    }

    process(inputs, outputs, parameters) {
        if (!this.wasmInstance) return true;

        const currentTime = globalThis.currentTime;
        const frameCount = outputs[0][0].length; // usually 128
        
        // Calculate block timing boundaries
        const blockDuration = frameCount / sampleRate;
        const blockEndTime = currentTime + blockDuration;

        // --- SCHEDULER (With Offset Logic) ---
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            // Remove expired notes
            if (currentTime > note.startTime + note.duration) {
                this.activeNotes.splice(i, 1);
                continue;
            }
            
            // Process active notes
            if (currentTime >= note.startTime) {
                let density = note.params.density || 20;
                if (density < 1) density = 1;
                let interval = 1 / density;
                
                // Overlap Logic: Calculate interval based on overlap if set
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    const overlapInterval = grainDur / Math.max(0.1, note.params.overlap);
                    interval = overlapInterval;
                }

                let spawnLimit = 20; // Increased limit for high density
                
                // Loop while the NEXT grain falls within THIS block
                while (note.nextGrainTime < blockEndTime && spawnLimit > 0) {
                    
                    // Logic:
                    // If nextGrainTime is in the past (lag), spawn immediately (offset 0).
                    // If nextGrainTime is in the future (within this block), calculate offset.
                    
                    let offset = 0;
                    if (note.nextGrainTime > currentTime) {
                        const timeDiff = note.nextGrainTime - currentTime;
                        offset = Math.floor(timeDiff * sampleRate);
                    }
                    
                    // Clamp offset to valid range [0, 127] for safety
                    // This ensures we never ask WASM to wait longer than the current block
                    offset = Math.max(0, Math.min(frameCount - 1, offset));

                    // Only spawn if it's actually time (or past time)
                    if (note.nextGrainTime >= note.startTime) {
                         this.spawnGrain(note, offset);
                    }
                    
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        // --- DSP ---
        try {
            this.wasmInstance.exports.process(sampleRate);
        } catch (e) {
            console.error("WASM Process Crashed:", e);
            this.wasmInstance = null; 
            return true;
        }
        
        const blockSize = 128;
        const bytesPerBlock = blockSize * 4;
        const bytesPerTrack = bytesPerBlock * 2; 

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            if (!output || output.length === 0) continue;

            const trackOffsetBytes = this.PTR_OUTPUT_START + (i * bytesPerTrack);
            
            // Safety check for read bounds
            if (trackOffsetBytes + bytesPerTrack > this.memory.buffer.byteLength) {
                break; 
            }
            
            const leftData = new Float32Array(this.memory.buffer, trackOffsetBytes, blockSize);
            output[0].set(leftData);

            if (output.length > 1) {
                const rightData = new Float32Array(this.memory.buffer, trackOffsetBytes + bytesPerBlock, blockSize);
                output[1].set(rightData);
            }
        }

        return true;
    }
}

registerProcessor('wasm-granular-processor', WasmGranularProcessor);