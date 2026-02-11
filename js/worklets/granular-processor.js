// Wasm-powered Granular Processor (v3 - Robust Init)

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.wasmExports = null;
        this.outputBufferPtr = -1;
        this.outputBufferSize = 0;
        this.frameCounter = 0;
        this.initError = null;
        
        console.log("[Worklet] Constructor called. Processor alive.");

        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'initWasm') this.initWasm(data.module);
            else if (type === 'setBuffer') this.uploadBuffer(data.trackId, data.buffer);
            else if (type === 'noteOn') this.scheduleGrain(data);
            else if (type === 'stopAll') this.wasmExports?.stopAll();
        };
    }

    initWasm(module) {
        console.log("[Worklet] Received Wasm Module. Instantiating...");
        
        const imports = {
            env: { 
                abort: (msg, file, line, col) => console.error(`[Worklet] AS Abort: ${msg} ${file}:${line}:${col}`) 
            },
            Math: Math 
        };

        try {
            // Use Synchronous instantiation for immediate result/error
            const instance = new WebAssembly.Instance(module, imports);
            this.wasmExports = instance.exports;
            this.wasmExports.init();
            console.log("[Worklet] ✅ Wasm Instantiated & Initialized Successfully!");
        } catch (e) {
            this.initError = e;
            console.error("[Worklet] ❌ Wasm Instantiation Error:", e);
        }
    }

    uploadBuffer(trackId, data) {
        if (!this.wasmExports) return;
        try {
            const ptr = this.wasmExports.allocateBuffer(data.length);
            new Float32Array(this.wasmExports.memory.buffer).set(data, ptr >>> 2);
            this.wasmExports.setTrackBuffer(trackId, ptr, data.length);
            console.log(`[Worklet] Buffer Set Trk${trackId} Len:${data.length}`);
        } catch (e) {
            console.error("[Worklet] Buffer Upload Error:", e);
        }
    }

    scheduleGrain(data) {
        if (!this.wasmExports) return;
        const offset = Math.max(0, Math.floor((data.time - currentTime) * (globalThis.sampleRate || 44100)));
        const dur = Math.floor((data.params.grainSize || 0.1) * (globalThis.sampleRate || 44100));
        
        this.wasmExports.spawnGrain(
            data.trackId, data.params.position, dur, 
            data.params.pitch||1, data.params.velocity||1, 
            data.params.spray||0, offset
        );
    }

    process(inputs, outputs) {
        // --- FALLBACK DEBUG MODE ---
        // If Wasm failed to load, generate a JS Sine Wave to prove Audio Connection
        if (!this.wasmExports) {
            const output = outputs[0]; // Track 0
            if (output && output[0]) {
                const channel = output[0];
                for (let i = 0; i < channel.length; i++) {
                    // 220Hz Sine Wave (Low Beep)
                    channel[i] = Math.sin(currentTime * 2 * Math.PI * 220) * 0.1;
                }
                
                // Log once per second to prove we are running
                this.frameCounter++;
                if (this.frameCounter % 350 === 0) {
                     console.warn("[Worklet] ⚠️ Wasm not ready. Playing JS Fallback Tone (220Hz). Connection is GOOD.");
                     if (this.initError) console.error("[Worklet] Previous Init Error:", this.initError);
                }
            }
            return true;
        }

        // --- WASM MODE ---
        const numTracks = outputs.length;
        const frameCount = 128;
        const totalSamples = numTracks * 2 * frameCount;

        // Resize buffer if needed
        if (this.outputBufferSize !== totalSamples) {
            this.outputBufferPtr = this.wasmExports.allocateBuffer(totalSamples);
            this.outputBufferSize = totalSamples;
        }

        // Zero Buffer
        const heap = new Float32Array(this.wasmExports.memory.buffer);
        // Safe check for memory growth detachment
        if (heap.length === 0) {
             console.error("[Worklet] Memory Detached!"); 
             return true;
        }
        
        heap.fill(0, this.outputBufferPtr >>> 2, (this.outputBufferPtr >>> 2) + totalSamples);

        // Run DSP
        this.wasmExports.process(this.outputBufferPtr, frameCount);

        // Copy to Output
        const outPtr = this.outputBufferPtr >>> 2;
        
        for (let t = 0; t < numTracks; t++) {
            const output = outputs[t];
            if (!output || output.length === 0) continue;
            
            const trackOffset = t * 2 * frameCount;
            // Left
            output[0].set(heap.subarray(outPtr + trackOffset, outPtr + trackOffset + frameCount));
            // Right
            if (output[1]) {
                output[1].set(heap.subarray(outPtr + trackOffset + frameCount, outPtr + trackOffset + 2 * frameCount));
            }
        }
        
        return true;
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);