/**
 * BeatOS Hybrid Granular Processor (FIXED)
 */

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        
        this.MODE = { JS_ONLY: 0, WASM_ONLY: 1, NULL_TEST: 2 };
        this.currentMode = this.MODE.JS_ONLY;

        this.debugFrameCount = 0;

        // JS STATE
        this.MAX_VOICES = 64;
        this.jsVoices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
            cleanMode: false, edgeCrunch: 0.0
        }));
        this.jsActiveIndices = [];
        
        // WASM STATE
        this.memory = new WebAssembly.Memory({ initial: 256, maximum: 2048 });
        this.heapF32 = new Float32Array(this.memory.buffer);
        this.bufferMap = new Map(); 
        this.freeHeapPtr = 8;
        this.wasmInstance = null;
        this.isWasmReady = false;

        // SHARED
        this.activeNotes = [];
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this._rngState = 0xCAFEBABE;

        // LUT
        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        const alpha = 0.5; 
        for(let i=0; i<this.LUT_SIZE; i++) {
            const p = i / (this.LUT_SIZE - 1);
            if (p < alpha / 2) this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 1)));
            else if (p > 1 - alpha / 2) this.windowLUT[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * p / alpha - 2 / alpha + 1)));
            else this.windowLUT[i] = 1.0;
        }

        if (options && options.processorOptions && options.processorOptions.wasmBytes) {
            this.initWasm(options.processorOptions.wasmBytes);
        }

        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'initWasm': this.initWasm(data.bytes); break;
                case 'setMode': 
                    this.currentMode = data.mode; 
                    console.log(`[AudioWorklet] Mode: ${Object.keys(this.MODE)[data.mode]}`); 
                    break;
                case 'noteOn': 
                    if (this.debugFrameCount < 500) console.log("[AudioWorklet] Note Received Trk:", data.trackId);
                    this.handleNoteOn(data); 
                    break;
                case 'setBuffer': 
                    this.trackBuffers.set(Number(data.trackId), data.buffer);
                    if(this.isWasmReady) this.uploadBufferToWasm(data.trackId, data.buffer);
                    break;
                case 'stopAll': 
                    this.stopAllJsVoices(); 
                    this.activeNotes = []; 
                    break;
            }
        };
    }

    async initWasm(bytes) {
        try {
            const importObject = { env: { memory: this.memory, abort: () => console.error("Wasm Abort") } };
            const module = await WebAssembly.instantiate(bytes, importObject);
            this.wasmInstance = module.instance.exports;
            if (this.wasmInstance.init) this.wasmInstance.init(sampleRate);
            this.isWasmReady = true;
            this.trackBuffers.forEach((buf, id) => this.uploadBufferToWasm(id, buf));
            console.log("[AudioWorklet] Wasm Engine Online");
        } catch(e) { console.error(e); }
    }

    uploadBufferToWasm(trackId, float32Data) {
        const len = float32Data.length;
        const bytesNeeded = len * 4;
        let ptr = this.freeHeapPtr;
        if (ptr + bytesNeeded > this.memory.buffer.byteLength) {
            this.memory.grow(Math.ceil((ptr + bytesNeeded - this.memory.buffer.byteLength) / 65536));
            this.heapF32 = new Float32Array(this.memory.buffer);
        }
        this.heapF32.set(float32Data, ptr / 4);
        this.bufferMap.set(trackId, { ptr: ptr, length: len });
        this.freeHeapPtr += bytesNeeded + (8 - (bytesNeeded % 8)); 
    }

    random() {
        this._rngState ^= this._rngState << 13;
        this._rngState ^= this._rngState >>> 17;
        this._rngState ^= this._rngState << 5;
        return (this._rngState >>> 0) / 4294967296; 
    }

    handleNoteOn(data) {
        // FIX: Map 'time' (from message) to 'startTime' (used in logic)
        this.activeNotes.push({
            ...data,
            startTime: data.time, 
            nextGrainTime: data.time,
            basePosition: data.params.position
        });
    }

    process(inputs, outputs, parameters) {
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        
        // 1. SCHEDULER
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            
            if (now >= note.startTime) {
                let density = note.params.density || 20;
                let interval = 1 / Math.max(1, density);
                if (note.params.overlap > 0) interval = (note.params.grainSize || 0.1) / Math.max(0.1, note.params.overlap);

                let spawnLimit = 5;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && spawnLimit > 0) {
                    if (note.nextGrainTime >= now) {
                        this.dispatchGrain(note);
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        // 2. PROCESS
        const wasmPtr = this.freeHeapPtr;
        const scratchSize = outputs.length * 2 * frameCount;

        if (this.currentMode === this.MODE.JS_ONLY) {
            this.processJS(outputs, frameCount);
        } else if (this.currentMode === this.MODE.WASM_ONLY && this.isWasmReady) {
            this.processWasm(outputs, frameCount, wasmPtr);
        } else if (this.currentMode === this.MODE.NULL_TEST && this.isWasmReady) {
            this.processJS(outputs, frameCount);
            this.heapF32.fill(0, wasmPtr/4, (wasmPtr/4) + scratchSize);
            const ac = this.wasmInstance.getActiveVoiceCount();
            this.wasmInstance.processAudioBlock(wasmPtr, frameCount, ac);
            
            for (let t = 0; t < outputs.length; t++) {
                if(!outputs[t] || !outputs[t][0]) continue;
                const offL = (t * 2 * frameCount);
                const offR = offL + frameCount;
                for(let j=0; j<frameCount; j++) {
                    const wL = this.heapF32[(wasmPtr/4)+offL+j];
                    const wR = this.heapF32[(wasmPtr/4)+offR+j];
                    outputs[t][0][j] -= wL;
                    if(outputs[t][1]) outputs[t][1][j] -= wR;
                }
            }
        }

        this.currentFrame += frameCount;
        this.debugFrameCount++;
        return true;
    }

    dispatchGrain(note) {
        let pos = note.basePosition;
        if (note.params.scanSpeed && note.params.scanSpeed !== 0) {
            const timeSinceStart = currentTime - note.startTime;
            pos += note.params.scanSpeed * timeSinceStart;
            const wStart = note.params.windowStart || 0;
            const wEnd = note.params.windowEnd || 1;
            const wSize = wEnd - wStart;
            if (wSize > 0.0001) {
                let rel = pos - wStart;
                pos = wStart + (((rel % wSize) + wSize) % wSize);
            }
        }
        
        if (note.params.orbit > 0) {
             const wStart = note.params.windowStart || 0;
             const wEnd = note.params.windowEnd || 1;
             const wSize = wEnd - wStart;
             pos += (this.random() - 0.5) * note.params.orbit;
             if(wSize > 0) { if(pos < wStart) pos += wSize; if(pos > wEnd) pos -= wSize; }
        }
        if (note.params.spray > 0) pos += (this.random() * 2 - 1) * note.params.spray;
        pos = Math.max(0, Math.min(1, pos));
        
        const gLen = Math.floor((note.params.grainSize || 0.1) * sampleRate);
        const pitch = note.params.pitch || 1.0;
        const vel = note.params.velocity || 1.0;
        const clean = !!note.params.cleanMode;
        const crunch = note.params.edgeCrunch || 0;
        const orbit = note.params.orbit || 0;

        if (this.currentMode !== this.MODE.WASM_ONLY) {
            this.spawnJsGrain(note.trackId, pos, gLen, pitch, vel, clean, crunch);
        }
        if (this.currentMode !== this.MODE.JS_ONLY && this.isWasmReady) {
            const bufInfo = this.bufferMap.get(Number(note.trackId));
            if (bufInfo) {
                this.wasmInstance.spawnGrain(Number(note.trackId), bufInfo.ptr, bufInfo.length, pos, gLen, pitch, vel, clean, crunch, orbit);
            }
        }
    }

    spawnJsGrain(trackId, pos, gLen, pitch, vel, clean, crunch) {
        const buf = this.trackBuffers.get(Number(trackId));
        if(!buf) return;
        
        let v = this.jsVoices.find(v => !v.active);
        if (!v) {
            const idx = this.jsActiveIndices[0];
            if(idx !== undefined) { v = this.jsVoices[idx]; v.releasing = true; return; }
            return; 
        }
        
        v.active = true;
        v.trackId = Number(trackId);
        v.buffer = buf;
        v.bufferLength = buf.length;
        v.position = pos;
        v.phase = 0;
        v.grainLength = Math.max(128, gLen);
        v.invGrainLength = (this.LUT_SIZE - 1) / v.grainLength;
        v.pitch = pitch;
        v.velocity = vel;
        v.releasing = false;
        v.releaseAmp = 1.0;
        v.cleanMode = clean;
        v.edgeCrunch = crunch;
        
        if(!this.jsActiveIndices.includes(v.id)) this.jsActiveIndices.push(v.id);
    }

    processJS(outputs, frameCount) {
        for (let i = this.jsActiveIndices.length - 1; i >= 0; i--) {
            const vIdx = this.jsActiveIndices[i];
            const v = this.jsVoices[vIdx];
            const out = outputs[v.trackId];
            if(!out) { v.active = false; continue; }
            
            const L = out[0];
            const R = out[1];
            const buf = v.buffer;
            if(!buf) { v.active = false; continue; } // Safety

            let phase = v.phase;
            let relAmp = v.releaseAmp;
            const startPos = v.position * v.bufferLength;
            const activeCount = Math.max(1, this.jsActiveIndices.length);
            const scale = v.cleanMode ? (1.0/activeCount) : (1.0 / (1.0 + activeCount * 0.15));
            const useCubic = (v.pitch > 1.2 || v.pitch < 0.8);

            for(let j=0; j<frameCount; j++) {
                if(v.releasing) { relAmp -= 0.015; if(relAmp<=0.001) { v.active=false; break; } }
                if(phase >= v.grainLength) { v.active=false; break; }
                
                let rPos = startPos + (phase * v.pitch);
                let idx = rPos | 0;
                while(idx >= v.bufferLength) idx -= v.bufferLength;
                while(idx < 0) idx += v.bufferLength;
                let frac = rPos - idx;
                
                let sample = 0;
                if (useCubic) {
                    let i0=idx-1; if(i0<0) i0+=v.bufferLength;
                    let i1=idx;
                    let i2=idx+1; if(i2>=v.bufferLength) i2-=v.bufferLength;
                    let i3=idx+2; if(i3>=v.bufferLength) i3-=v.bufferLength;
                    let y0=buf[i0], y1=buf[i1], y2=buf[i2], y3=buf[i3];
                    let c0=y1, c1=0.5*(y2-y0), c2=y0-2.5*y1+2.0*y2-0.5*y3, c3=0.5*(y3-y0)+1.5*(y1-y2);
                    sample = ((c3*frac+c2)*frac+c1)*frac+c0;
                } else {
                    let i2=idx+1; if(i2>=v.bufferLength) i2=0;
                    sample = buf[idx] + frac * (buf[i2] - buf[idx]);
                }
                
                const lutIdx = (phase * v.invGrainLength) | 0;
                const win = this.windowLUT[Math.min(this.LUT_SIZE-1, lutIdx)];
                let val = sample * win * v.velocity * relAmp * scale;
                if (v.edgeCrunch > 0) { val *= (1.0 + v.edgeCrunch*2.0); val = Math.tanh(val); }

                L[j] += val;
                if(R) R[j] += val;
                phase++;
            }
            v.phase = phase;
            v.releaseAmp = relAmp;
            if(!v.active) this.jsActiveIndices.splice(i, 1);
        }
    }

    processWasm(outputs, frameCount, wasmPtr) {
        const totalFloats = outputs.length * 2 * frameCount;
        this.heapF32.fill(0, wasmPtr/4, (wasmPtr/4) + totalFloats);
        
        const activeCount = this.wasmInstance.getActiveVoiceCount();
        this.wasmInstance.processAudioBlock(wasmPtr, frameCount, activeCount);
        
        for (let t = 0; t < outputs.length; t++) {
            if(!outputs[t] || !outputs[t][0]) continue;
            const offL = (t * 2 * frameCount);
            const wasmL = this.heapF32.subarray((wasmPtr/4) + offL, (wasmPtr/4) + offL + frameCount);
            const wasmR = this.heapF32.subarray((wasmPtr/4) + offL + frameCount, (wasmPtr/4) + offL + 2*frameCount);
            outputs[t][0].set(wasmL);
            if(outputs[t][1]) outputs[t][1].set(wasmR);
        }
    }
    
    stopAllJsVoices() {
        this.jsActiveIndices.forEach(idx => this.jsVoices[idx].releasing = true);
    }
}

registerProcessor('granular-processor', BeatOSGranularProcessor);