/**
 * BeatOS Granular Processor (WASM Optimized)
 * - Uses SIMD-accelerated WASM for Cubic Interpolation
 */

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.wasm = null;
        this.MAX_VOICES = 64;
        
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
            cleanMode: false, edgeCrunch: 0.0, orbit: 0.0
        }));
        
        this.activeVoiceIndices = [];
        this.trackBuffers = new Map();
        this._rngState = 0xCAFEBABE;

        // Tukey Window LUT
        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        for(let i=0; i<this.LUT_SIZE; i++) {
            const phase = i/(this.LUT_SIZE-1);
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        
        this.port.onmessage = async (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'init-wasm': 
                    // Receive the pre-compiled module from the host
                    const instance = await WebAssembly.instantiate(data.module, {});
                    this.wasm = instance.exports;
                    break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.trackBuffers.set(Number(data.trackId), data.buffer); break;
                case 'stopAll': this.stopAllVoices(); break;
            }
        };
    }

    random() {
        this._rngState ^= this._rngState << 13;
        this._rngState ^= this._rngState >>> 17;
        this._rngState ^= this._rngState << 5;
        return (this._rngState >>> 0) / 4294967296;
    }

    handleNoteOn(data) {
        this.activeNotes = this.activeNotes || [];
        this.activeNotes.push({
            trackId: Number(data.trackId), 
            startTime: data.time, 
            duration: data.duration,
            params: data.params, 
            nextGrainTime: data.time,
            basePosition: data.params.position 
        });
    }

    process(inputs, outputs, parameters) {
        // Wait for WASM to be ready before making sound
        if (!this.wasm) return true;

        const frameCount = outputs[0][0].length;
        const now = currentTime;
        
        // ... (Scheduler logic same as before) ...

        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const vIdx = this.activeVoiceIndices[i];
            const voice = this.voices[vIdx];
            const trackOut = outputs[voice.trackId];
            
            if (!trackOut) { this.killVoice(i); continue; }
            
            const L = trackOut[0], R = trackOut[1];
            const buf = voice.buffer, bufLen = voice.bufferLength;
            const pitch = voice.pitch, gLen = voice.grainLength, invGL = voice.invGrainLength;
            const start = voice.position * bufLen;

            let ph = voice.phase, amp = voice.releaseAmp, rel = voice.releasing;

            for (let j = 0; j < frameCount; j++) {
                if (rel) { amp -= 0.015; if (amp <= 0) { this.killVoice(i); break; } }
                if (ph >= gLen) { this.killVoice(i); break; }
                
                let rPos = start + (ph * pitch);
                while (rPos >= bufLen) rPos -= bufLen;
                while (rPos < 0) rPos += bufLen;
                
                let idx = rPos | 0;
                let frac = rPos - idx;

                // --- HIGH PERFORMANCE SWAP ---
                // Fetching 4 neighboring samples for Cubic Spline
                const y1 = buf[idx];
                const y0 = buf[(idx - 1 + bufLen) % bufLen];
                const y2 = buf[(idx + 1) % bufLen];
                const y3 = buf[(idx + 2) % bufLen];

                // Calling the WASM function we compiled earlier
                const sample = this.wasm.interpolateCubic(y0, y1, y2, y3, frac);
                // -----------------------------

                const winIdx = Math.min(this.LUT_SIZE - 1, (ph * invGL) | 0);
                const win = this.windowLUT[winIdx];
                const val = sample * win * voice.velocity * amp;
                
                L[j] += val; 
                if (R) R[j] += val;
                ph++;
            }
            voice.phase = ph; voice.releasing = rel; voice.releaseAmp = amp;
        }
        return true;
    }
}