// Granular SynthWorklet - Fixed WASM initialization, state tracking, and stop logic
import { MAX_TRACKS } from '../utils/constants.js';
import { GranularLogic } from '../utils/GranularLogic.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        
        // Track buffer identity to detect changes manually
        this.bufferVersionMap = new Map(); 
        this.pendingLoads = new Map();
        
        // Track last bar start time for Reset On Bar logic
        this.lastBarStartTimes = new Map();
        
        this.activeGrains = 0;
    }

    async init() {
        if (this.isInitialized) return;
        
        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx) throw new Error('AudioContext not available');
        
        try {
            // 1. Fetch and compile WASM on the main thread
            const response = await fetch('build/release.wasm');
            const buffer = await response.arrayBuffer();
            const wasmModule = await WebAssembly.compile(buffer);

            // 2. Load the AudioWorklet module
            const workletCode = this.getWorkletCode();
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await audioCtx.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);

            // 3. Create the node
            const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 
            this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                numberOfInputs: 0,
                numberOfOutputs: MAX_TRACKS,
                outputChannelCount: outputChannelCounts,
                processorOptions: {}
            });
            
            // 4. Send the compiled WASM module to the Worklet
            this.workletNode.port.postMessage({
                type: 'init-wasm',
                data: { module: wasmModule }
            });

            this.workletNode.port.onmessage = (event) => {
                if (event.data.type === 'grainCount') {
                    this.activeGrains = event.data.count;
                }
            };

            this.workletNode.connectedTracks = new Set();
            this.isInitialized = true;
            console.log("[BeatOS] WASM DSP Engine Initialized");
        } catch (error) {
            console.error('[GranularSynthWorklet] Initialization failed:', error);
            throw error;
        }
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = track.id;
        
        if (!track.buffer) return;

        const lastKnownBuffer = this.bufferVersionMap.get(trackId);
        if (lastKnownBuffer === track.buffer) {
            return; 
        }

        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            const channelData = track.buffer.getChannelData(0);
            const bufferCopy = new Float32Array(channelData);
            
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: { trackId: Number(trackId), buffer: bufferCopy }
            }, [bufferCopy.buffer]); 
            
            resolve();
            this.pendingLoads.delete(trackId);
        });

        await loadPromise;
        this.bufferVersionMap.set(trackId, track.buffer);
    }

    syncTrackBusParams(track, time = null) {
        if (!track.bus || !this.audioEngine.getContext()) return;
        const ctx = this.audioEngine.getContext();
        const now = time !== null ? time : ctx.currentTime;
        const p = track.params;

        let mod = { filter: 0, hpFilter: 0, volume: 0, pan: 0 };
        track.lfos.forEach(lfo => {
            if (lfo.amount === 0) return;
            const v = lfo.getValue(now);
            if (lfo.targets && lfo.targets.length > 0) {
                lfo.targets.forEach(target => {
                    if (target === 'filter') mod.filter += v * 5000; 
                    if (target === 'hpFilter') mod.hpFilter += v * 2000; 
                    if (target === 'volume') mod.volume += v * 0.5;
                    if (target === 'pan') mod.pan += v;
                });
            } else if (lfo.target) {
                if (lfo.target === 'filter') mod.filter += v * 5000; 
                if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000; 
                if (lfo.target === 'volume') mod.volume += v * 0.5;
                if (lfo.target === 'pan') mod.pan += v;
            }
        });

        if (track.bus.hp) {
            const freq = this.audioEngine.getMappedFrequency(Math.max(20, p.hpFilter + mod.hpFilter), 'hp');
            track.bus.hp.frequency.setTargetAtTime(freq, now, 0.05);
        }
        if (track.bus.lp) {
            const freq = this.audioEngine.getMappedFrequency(Math.max(100, p.filter + mod.filter), 'lp');
            track.bus.lp.frequency.setTargetAtTime(freq, now, 0.05);
        }
        if (track.bus.vol) {
            const gain = Math.max(0, p.volume + mod.volume);
            track.bus.vol.gain.setTargetAtTime(gain, now, 0.05);
        }
        if (track.bus.pan) {
            const panVal = Math.max(-1, Math.min(1, p.pan + mod.pan));
            track.bus.pan.pan.setTargetAtTime(panVal, now, 0.05);
        }
    }

    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2, stepIndex = 0) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id, stepIndex);
            return;
        }

        if (!this.isInitialized) await this.init();
        if (!this.audioEngine.getContext() || !track.buffer || !track.bus) return;

        await this.ensureBufferLoaded(track);

        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        this.syncTrackBusParams(track, time);

        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0, relGrain:0, edgeCrunch: 0, orbit: 0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.targets && lfo.targets.length > 0) {
                lfo.targets.forEach(target => {
                    if(mod[target] !== undefined) mod[target] += v;
                });
            } else if (lfo.target && mod[lfo.target] !== undefined) {
                mod[lfo.target] += v;
            }
        });

        const p = track.params;
        let gainMult = 1.0;
        switch(velocityLevel) {
            case 1: gainMult = 0.4; break;
            case 2: gainMult = 0.75; break;
            case 3: gainMult = 1.0; break;
            default: gainMult = 0.75;
        }

        if (stepIndex === 0) {
            this.lastBarStartTimes.set(track.id, time);
        }

        let scanTime = time;
        if (track.resetOnTrig) {
            scanTime = 0;
        } else if (track.resetOnBar) {
            const barStart = this.lastBarStartTimes.get(track.id) || time;
            scanTime = Math.max(0, time - barStart);
        }
        
        const { absPos, actStart, actEnd } = GranularLogic.calculateEffectivePosition(p, mod, time, scanTime);

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: Number(track.id),
                time: time,
                duration: (p.relGrain || 0.4) + mod.relGrain,
                stepIndex: stepIndex,
                params: {
                    position: absPos,
                    scanSpeed: p.scanSpeed + mod.scanSpeed,
                    windowStart: actStart,
                    windowEnd: actEnd,
                    density: Math.max(1, (p.density || 20) + mod.density),
                    grainSize: Math.max(0.005, (p.grainSize || 0.1) + mod.grainSize),
                    overlap: Math.max(0, (p.overlap || 0) + mod.overlap),
                    pitch: Math.max(0.01, (p.pitch || 1.0) + mod.pitch),
                    velocity: gainMult,
                    spray: Math.max(0, (p.spray || 0) + mod.spray),
                    resetOnBar: !!track.resetOnBar,
                    resetOnTrig: !!track.resetOnTrig,
                    cleanMode: !!track.cleanMode,
                    edgeCrunch: Math.max(0, Math.min(1, (p.edgeCrunch || 0) + mod.edgeCrunch)),
                    orbit: Math.max(0, Math.min(1, (p.orbit || 0) + mod.orbit))
                }
            }
        });

        scheduleVisualDrawCallback(time, track.id, stepIndex);
    }
    
    stopAll() {
        if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' });
        this.activeGrains = 0;
    }

    stopTrack(trackId) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({
                type: 'stopTrack',
                data: { trackId: Number(trackId) }
            });
        }
    }
    
    getActiveGrainCount() { 
        return this.activeGrains; 
    }
    
    setMaxGrains(max) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({
                type: 'setMaxGrains',
                data: { max }
            });
        }
    }

    getWorkletCode() {
        return `
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
        this.activeNotes = [];
        this.trackBuffers = new Map();
        this._rngState = 0xCAFEBABE;
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
                    const instance = await WebAssembly.instantiate(data.module, {});
                    this.wasm = instance.exports;
                    break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.trackBuffers.set(Number(data.trackId), data.buffer); break;
                case 'stopAll': this.stopAllVoices(); break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'setMaxGrains': this.safetyLimit = data.max; break;
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
            trackId: Number(data.trackId), startTime: data.time, duration: data.duration,
            params: data.params, nextGrainTime: data.time, basePosition: data.params.position 
        });
    }
    process(inputs, outputs, parameters) {
        // Essential: Zero-fill all outputs to avoid adding to "garbage" memory
        for (let o = 0; o < outputs.length; o++) {
            const out = outputs[o];
            for (let c = 0; c < out.length; c++) {
                out[c].fill(0);
            }
        }

        if (!this.wasm) return true;
        
        const frameCount = outputs[0][0].length;
        const now = currentTime;

        // 1. SCHEDULER
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let interval = 1 / Math.max(0.1, note.params.density || 20);
                let spawnLimit = 5;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && spawnLimit > 0) {
                    if (note.nextGrainTime >= now && this.activeVoiceIndices.length < this.MAX_VOICES) {
                        this.spawnGrain(note);
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        if (this.activeVoiceIndices.length === 0) return true;

        // 2. DSP LOOP
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

                const y1 = buf[idx] || 0;
                const y0 = buf[(idx - 1 + bufLen) % bufLen] || 0;
                const y2 = buf[(idx + 1) % bufLen] || 0;
                const y3 = buf[(idx + 2) % bufLen] || 0;

                const sample = this.wasm.interpolateCubic(y0, y1, y2, y3, frac);

                const winIdx = Math.min(this.LUT_SIZE - 1, (ph * invGL) | 0);
                const win = this.windowLUT[winIdx];
                const val = sample * win * voice.velocity * amp;

                L[j] += val; if (R) R[j] += val;
                ph++;
            }
            voice.phase = ph; voice.releasing = rel; voice.releaseAmp = amp;
        }

        return true;
    }
    spawnGrain(note) {
        const buf = this.trackBuffers.get(Number(note.trackId));
        if(!buf || buf.length < 2) return;
        let v = null;
        for(let i=0; i<this.MAX_VOICES; i++) {
            if(!this.voices[i].active) { v = this.voices[i]; this.activeVoiceIndices.push(i); break; }
        }
        if(!v) return; 
        let pos = note.basePosition + (note.params.scanSpeed * (currentTime - note.startTime));
        const wStart = note.params.windowStart, wEnd = note.params.windowEnd, wSize = wEnd - wStart;
        if (wSize > 0.0001) pos = wStart + (((pos - wStart) % wSize) + wSize) % wSize;
        else pos = wStart;
        if(note.params.spray > 0) pos += (this.random()*2-1)*note.params.spray;
        pos = Math.max(0, Math.min(1, pos));
        v.active = true; v.trackId = note.trackId; v.buffer = buf; v.bufferLength = buf.length;
        v.position = pos; v.phase = 0; v.grainLength = Math.max(128, Math.floor((note.params.grainSize||0.1) * sampleRate));
        v.invGrainLength = (this.LUT_SIZE - 1) / v.grainLength;
        v.pitch = note.params.pitch||1; v.velocity = note.params.velocity||1;
        v.releasing = false; v.releaseAmp = 1.0;
    }
    killVoice(idx) {
        const vIdx = this.activeVoiceIndices[idx];
        this.voices[vIdx].active = false;
        const last = this.activeVoiceIndices.pop();
        if (idx < this.activeVoiceIndices.length) this.activeVoiceIndices[idx] = last;
    }
    stopAllVoices() { 
        this.activeNotes = [];
        for(let i=0; i<this.activeVoiceIndices.length; i++) {
            this.voices[this.activeVoiceIndices[i]].releasing = true; 
        }
    }
    stopTrack(trackId) {
        this.activeNotes = this.activeNotes.filter(n => n.trackId !== trackId);
        for(let i=0; i<this.activeVoiceIndices.length; i++) {
            const v = this.voices[this.activeVoiceIndices[i]];
            if (v.trackId === trackId) v.releasing = true;
        }
    }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}