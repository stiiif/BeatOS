// js/worklets/granular-processor-wasm.js

class GranularProcessorWasm extends AudioWorkletProcessor {
    constructor(options) {
        super();
        
        const wasmBytes = options.processorOptions.wasmBytes;
        if (!wasmBytes) throw new Error("No WASM bytes provided");

        this.wasm = null;
        this.heapFloat32 = null;
        this.blockBufferSize = 128 * 2 * 4; 
        this.outputPtr = 0;
        this.activeNotes = [];
        this.currentTime = 0;

        const importObject = {
            env: {
                abort: (msg, file, line, col) => console.error(`AS Abort: ${line}:${col}`),
                trace: (msg, n, val) => console.log(`AS Trace: ${val}`)
            }
        };

        this.ready = false;
        
        WebAssembly.instantiate(wasmBytes, importObject).then(module => {
            this.wasm = module.instance.exports;
            this.wasm.init();
            this.outputPtr = this.wasm.allocateBuffer(256); 
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
            case 'setBuffer': this.loadBufferToWasm(msg.data.trackId, msg.data.buffer); break;
            case 'noteOn': this.scheduleNote(msg.data); break;
            case 'stopAll': this.wasm.stopAll(); this.activeNotes = []; break;
        }
    }

    loadBufferToWasm(trackId, floatData) {
        const len = floatData.length;
        const ptr = this.wasm.allocateBuffer(len);
        const bytesNeeded = (ptr + (len * 4)); 
        
        if (bytesNeeded > this.memory.buffer.byteLength) {
            const missingBytes = bytesNeeded - this.memory.buffer.byteLength;
            const pagesToGrow = Math.ceil(missingBytes / 65536) + 4; 
            try { this.memory.grow(pagesToGrow); } catch(e) { console.error("WASM OOM", e); return; }
        }

        this.heapFloat32 = new Float32Array(this.memory.buffer);
        const startIdx = ptr >> 2; 
        if (startIdx + len <= this.heapFloat32.length) {
            this.heapFloat32.set(floatData, startIdx);
            this.wasm.setTrackBuffer(trackId, ptr, len);
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

        const frameCount = outputs[0][0].length; 
        const now = currentTime;

        // --- 1. JS SCHEDULER ---
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (now > note.startTime + 2.0) {
                this.activeNotes.splice(i, 1);
                continue;
            }

            if (now >= note.startTime) {
                let density = note.params.density || 20;
                // Ensure density has a minimum valid value to prevent division by zero or infinite loops
                if (density < 0.1) density = 0.1;
                let interval = 1 / density;
                
                // --- FIX: DISABLED OVERLAP OVERRIDE ---
                // In the original JS, this prevented Density from working if Overlap > 0.
                // We disabling it so Density Knob always controls rate.
                /*
                if (note.params.overlap > 0) {
                    interval = note.params.grainSize / Math.max(0.1, note.params.overlap);
                }
                */

                let lookAhead = now + (frameCount / sampleRate);
                
                // Safety limiter to prevent infinite loops if interval is extremely small
                let spawnCount = 0;
                const MAX_SPAWNS_PER_BLOCK = 50;

                while (note.nextGrainTime < lookAhead && spawnCount < MAX_SPAWNS_PER_BLOCK) {
                    if (note.nextGrainTime >= now) {
                        
                        // Scan Speed Logic
                        let timeSinceStart = note.nextGrainTime - note.startTime;
                        let currentPos = note.params.position + (note.params.scanSpeed * timeSinceStart);
                        
                        const wStart = note.params.windowStart || 0;
                        const wEnd = note.params.windowEnd !== undefined ? note.params.windowEnd : 1;
                        const wSize = wEnd - wStart;
                        
                        if (wSize > 0.0001) {
                            if (currentPos > wEnd) currentPos = wStart + ((currentPos - wStart) % wSize);
                            else if (currentPos < wStart) currentPos = wEnd - ((wStart - currentPos) % wSize);
                        }

                        this.wasm.noteOn(
                            note.trackId,
                            currentPos,
                            note.params.grainSize,
                            note.params.pitch,
                            note.params.gain,
                            note.params.pan,
                            note.params.spray,
                            note.params.orbit || 0,
                            note.params.edgeCrunch || 0,
                            !!note.params.cleanMode
                        );
                        spawnCount++;
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