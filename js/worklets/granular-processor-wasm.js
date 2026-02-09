// js/worklets/granular-processor-wasm.js

class GranularProcessorWasm extends AudioWorkletProcessor {
    constructor(options) {
        super();
        
        const wasmBytes = options.processorOptions.wasmBytes;
        if (!wasmBytes) throw new Error("No WASM bytes provided");

        this.wasm = null;
        this.heapFloat32 = null;
        
        // Allocate an output buffer in JS to copy data back from WASM
        // 128 frames * 2 channels * 4 bytes/float = 1024 bytes
        this.blockBufferSize = 128 * 2 * 4; 
        this.outputPtr = 0;

        // Scheduler State
        this.activeNotes = [];
        this.currentTime = 0;

        // Compile WASM
        const importObject = {
            env: {
                abort: (msg, file, line, col) => console.error(`AS Abort: ${line}:${col}`),
                trace: (msg, n, val) => console.log(`AS Trace: ${val}`)
            }
        };

        this.ready = false;
        
        WebAssembly.instantiate(wasmBytes, importObject).then(module => {
            this.wasm = module.instance.exports;
            
            // Initialize WASM
            this.wasm.init();
            
            // Allocate Output Buffer in WASM Memory
            this.outputPtr = this.wasm.allocateBuffer(256); // 128 samples * 2 channels
            
            // Create view into WASM memory
            this.memory = this.wasm.memory;
            this.heapFloat32 = new Float32Array(this.memory.buffer);
            
            this.ready = true;
            this.port.postMessage({ type: 'status', msg: 'WASM Ready' });
        });

        this.port.onmessage = (e) => this.handleMessage(e.data);
    }

    handleMessage(msg) {
        if (!this.ready) return;

        switch(msg.type) {
            case 'setBuffer':
                this.loadBufferToWasm(msg.data.trackId, msg.data.buffer);
                break;
            case 'noteOn':
                this.scheduleNote(msg.data);
                break;
            case 'stopAll':
                this.wasm.stopAll();
                this.activeNotes = [];
                break;
        }
    }

    loadBufferToWasm(trackId, floatData) {
        const len = floatData.length;
        
        // 1. Get pointer from WASM (Bump allocator)
        const ptr = this.wasm.allocateBuffer(len);
        
        // 2. CHECK & GROW MEMORY
        const bytesNeeded = (ptr + (len * 4)); 
        
        if (bytesNeeded > this.memory.buffer.byteLength) {
            const missingBytes = bytesNeeded - this.memory.buffer.byteLength;
            const pagesToGrow = Math.ceil(missingBytes / 65536) + 4; 
            try {
                this.memory.grow(pagesToGrow);
            } catch(e) {
                console.error("WASM Memory OOM - Failed to grow", e);
                return;
            }
        }

        // 3. Refresh view 
        this.heapFloat32 = new Float32Array(this.memory.buffer);
        
        // 4. Copy data safely
        const startIdx = ptr >> 2; 
        
        if (startIdx + len <= this.heapFloat32.length) {
            this.heapFloat32.set(floatData, startIdx);
            this.wasm.setTrackBuffer(trackId, ptr, len);
        } else {
            console.error(`Critical: WASM Buffer writes out of bounds.`);
        }
    }

    scheduleNote(data) {
        this.activeNotes.push({
            trackId: data.trackId,
            startTime: data.time,
            params: data.params,
            nextGrainTime: data.time
        });
    }

    process(inputs, outputs, parameters) {
        if (!this.ready) return true;

        const frameCount = outputs[0][0].length; // Should be 128
        const now = currentTime;

        // --- 1. JS SCHEDULER (Lightweight) ---
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (now > note.startTime + 2.0) {
                this.activeNotes.splice(i, 1);
                continue;
            }

            if (now >= note.startTime) {
                // Calculate Density Interval
                let density = note.params.density || 20;
                let interval = 1 / density;
                
                // Override for overlap mode (Matches Original Logic)
                // Note: If overlap > 0, density knob will effectively be ignored.
                if (note.params.overlap > 0) {
                    interval = note.params.grainSize / Math.max(0.1, note.params.overlap);
                }

                // Catch up loop
                let lookAhead = now + (frameCount / sampleRate);
                
                while (note.nextGrainTime < lookAhead) {
                    if (note.nextGrainTime >= now) {
                        
                        // FIX: Calculate Dynamic Position (Scan Speed)
                        let timeSinceStart = note.nextGrainTime - note.startTime;
                        let currentPos = note.params.position + (note.params.scanSpeed * timeSinceStart);
                        
                        // Wrap Logic (Simple wrap, detailed wrapping is in Main Thread GranularLogic)
                        // This keeps the grain moving inside the window during the note's life
                        const wStart = note.params.windowStart || 0;
                        const wEnd = note.params.windowEnd || 1;
                        const wSize = wEnd - wStart;
                        
                        if (wSize > 0.0001) {
                            // Re-wrap relative to window
                            // We assume 'position' passed in was already anchored.
                            if (currentPos > wEnd) currentPos = wStart + ((currentPos - wStart) % wSize);
                            else if (currentPos < wStart) currentPos = wEnd - ((wStart - currentPos) % wSize);
                        }

                        // TRIGGER GRAIN IN WASM with updated Params
                        this.wasm.noteOn(
                            note.trackId,
                            currentPos, // Use dynamic position
                            note.params.grainSize,
                            note.params.pitch,
                            note.params.gain,
                            note.params.pan,
                            note.params.spray,
                            note.params.orbit || 0,
                            note.params.edgeCrunch || 0,
                            !!note.params.cleanMode
                        );
                    }
                    note.nextGrainTime += interval;
                }
            }
        }

        // --- 2. WASM DSP ---
        this.wasm.process(this.outputPtr, frameCount);

        // --- 3. OUTPUT COPY ---
        if (this.heapFloat32.buffer !== this.memory.buffer) {
             this.heapFloat32 = new Float32Array(this.memory.buffer);
        }

        const outputL = outputs[0][0]; 
        const outputR = outputs[0][1]; 
        
        if (outputL) {
            const rawDataPtr = this.outputPtr >> 2; 
            for (let i = 0; i < frameCount; i++) {
                outputL[i] = this.heapFloat32[rawDataPtr + (i * 2)];
                outputR[i] = this.heapFloat32[rawDataPtr + (i * 2) + 1];
            }
        }

        return true;
    }
}

registerProcessor('beatos-granular-wasm', GranularProcessorWasm);