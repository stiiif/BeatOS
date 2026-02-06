// Granular SynthWorklet - Optimized with Linear Interpolation Processor
import { MAX_TRACKS } from '../utils/constants.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        
        this.trackBufferCache = new WeakMap();
        this.pendingLoads = new Map();
        
        console.log('[GranularSynthWorklet] Created');
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) throw new Error('AudioContext not available');
            
            try {
                // Load Optimized Worklet Code
                const workletCode = this.getWorkletCode();
                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const blobURL = URL.createObjectURL(blob);
                
                await audioCtx.audioWorklet.addModule(blobURL);
                URL.revokeObjectURL(blobURL);
                
                // Configure 32 Stereo Outputs
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts,
                    processorOptions: {}
                });
                
                // Connect routing on demand
                this.workletNode.connectedTracks = new Set();
                
                this.isInitialized = true;
                console.log('[GranularSynthWorklet] ✅ Optimized Processor Loaded');
            } catch (error) {
                console.error('[GranularSynthWorklet] ❌ Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        
        const trackId = track.id;
        const cachedBuffer = this.trackBufferCache.get(track);
        
        if (cachedBuffer && cachedBuffer === track.buffer) return;
        if (!track.buffer) return;
        
        // Prevent duplicate uploads
        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            const channelData = track.buffer.getChannelData(0);
            const bufferCopy = new Float32Array(channelData);
            
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: {
                    trackId,
                    buffer: bufferCopy
                }
            }, [bufferCopy.buffer]); // Zero-copy transfer
            
            // Instant resolve, assume reliable transfer for UI responsiveness
            resolve();
            this.pendingLoads.delete(trackId);
        });
        
        await loadPromise;
        this.trackBufferCache.set(track, track.buffer);
    }

    setMaxVoices(count) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({
                type: 'setMaxVoices',
                data: count
            });
        }
    }

    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id);
            return;
        }

        if (!this.isInitialized) await this.init();
        if (!this.audioEngine.getContext() || !track.buffer || !track.bus) return;

        await this.ensureBufferLoaded(track);

        // Dynamic Routing: Connect specific output to track bus
        if (!this.workletNode.connectedTracks.has(track.id)) {
            // outputIndex = track.id
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        // Calculate Params
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, sampleStart:0, sampleEnd:0, scanSpeed:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
            else if (lfo.target === 'filter') mod.filter += v * 5000;
        });

        const p = track.params;
        let gainMult = 1.0;
        let sprayMod = 0;

        switch(velocityLevel) {
            case 1: gainMult = 0.4; if (!track.ignoreVelocityParams) sprayMod = 0.05; break;
            case 2: gainMult = 0.75; break;
            case 3: gainMult = 1.0; break;
            default: if (velocityLevel > 0) gainMult = 0.75; else return;
        }

        // Bus Automation (Filters/Pan)
        if(track.bus.lp) track.bus.lp.frequency.setValueAtTime(Math.max(100, Math.min(22000, p.filter + mod.filter)), time);
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        // Granular Params
        let winStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let winEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        if (winStart > winEnd) [winStart, winEnd] = [winEnd, winStart];
        
        if (p.scanSpeed !== 0 || mod.scanSpeed !== 0) {
            track.playhead = (track.playhead + ((p.scanSpeed + mod.scanSpeed) * 0.1)) % 1.0;
            if (track.playhead < 0) track.playhead += 1.0;
        } else {
            track.playhead = p.position;
        }

        let baseRelPos = (Math.abs(p.scanSpeed) > 0.01) ? track.playhead : p.position;
        let finalPos = winStart + (Math.max(0, Math.min(1, baseRelPos + mod.position)) * (winEnd - winStart));

        const density = Math.max(1, (p.density || 20) + mod.density);
        const grainSize = Math.max(0.01, (p.grainSize || 0.1) + mod.grainSize);
        // Overlap Removed
        const duration = (p.relGrain !== undefined ? p.relGrain : 0.4) + (mod.relGrain || 0);
        const pitch = Math.max(0.1, (p.pitch || 1.0) + mod.pitch);
        const spray = Math.max(0, (p.spray || 0) + mod.spray + sprayMod);

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: track.id,
                time: time,
                duration: duration,
                params: {
                    position: finalPos,
                    density: density,
                    grainSize: grainSize,
                    pitch: pitch,
                    velocity: gainMult,
                    spray: spray
                }
            }
        });

        scheduleVisualDrawCallback(time, track.id);
    }
    
    stopAll() {
        if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' });
        this.activeGrains = 0;
    }
    
    getActiveGrainCount() { return this.activeGrains; } // Placeholder
    setMaxGrains(max) { /* Handled in processor */ }

    // Optimized Processor Code (Inline to ensure loading)
    getWorkletCode() {
        return `
class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 64; // Default max voices
        this.voices = Array(64).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0
        }));
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        for(let i=0; i<this.LUT_SIZE; i++) {
            const phase = i/(this.LUT_SIZE-1);
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.trackBuffers.set(data.trackId, data.buffer); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'setMaxVoices': this.setMaxVoices(data); break;
            }
        };
    }
    
    setMaxVoices(count) {
        // Clamp between 1 and 64
        this.MAX_VOICES = Math.max(1, Math.min(64, count));
        // If we reduced voices, kill extras
        while (this.activeVoiceIndices.length > this.MAX_VOICES) {
            this.killVoice(this.activeVoiceIndices.length - 1);
        }
    }

    handleNoteOn(data) {
        this.activeNotes.push({
            trackId: data.trackId, startTime: data.time, duration: data.duration,
            params: data.params, nextGrainTime: data.time
        });
    }
    process(inputs, outputs, parameters) {
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        
        // 1. Scheduler
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let interval = 1 / Math.max(1, note.params.density || 20);
                // Overlap logic removed, purely density based
                
                let spawnLimit = 3; 
                while (note.nextGrainTime < now + (frameCount * 0.000023) && spawnLimit > 0) {
                    if (note.nextGrainTime >= now) this.spawnGrain(note);
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        if (this.activeVoiceIndices.length === 0) { this.currentFrame += frameCount; return true; }

        // 2. DSP
        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const vIdx = this.activeVoiceIndices[i];
            const voice = this.voices[vIdx];
            
            // Direct array access is faster
            const trackOut = outputs[voice.trackId];
            if (!trackOut) { this.killVoice(i); continue; }
            
            // Assume 2 channels (stereo) as configured in init()
            const L = trackOut[0];
            const R = trackOut[1];
            
            const buf = voice.buffer;
            const bufLen = voice.bufferLength;
            const pitch = voice.pitch;
            const gLen = voice.grainLength;
            const invGL = voice.invGrainLength;
            const start = voice.position * bufLen;
            const baseAmp = voice.velocity;
            
            let ph = voice.phase;
            let amp = voice.releaseAmp;
            let rel = voice.releasing;

            for (let j = 0; j < frameCount; j++) {
                if (rel) { 
                    amp -= 0.015; 
                    if (amp <= 0) { this.killVoice(i); break; } 
                }
                
                if (ph >= gLen) { this.killVoice(i); break; }
                
                // Optimized Read Position
                const rPos = start + (ph * pitch);
                let idx = rPos | 0; // Bitwise floor
                
                // Fast wrapping (conditional is faster than modulo for single wraps)
                if (idx >= bufLen) idx %= bufLen;
                
                const s1 = buf[idx];
                // Avoid ternary if possible
                let idx2 = idx + 1;
                if (idx2 >= bufLen) idx2 = 0;
                const s2 = buf[idx2];
                
                // Linear Interpolation
                const frac = rPos - idx;
                const sample = s1 + frac * (s2 - s1);
                
                // Window
                const winIdx = (ph * invGL) | 0;
                const win = this.windowLUT[winIdx];
                
                const val = sample * win * baseAmp * amp;
                
                L[j] += val; 
                R[j] += val;
                
                ph++;
            }
            voice.phase = ph; 
            voice.releasing = rel; 
            voice.releaseAmp = amp;
        }
        this.currentFrame += frameCount;
        return true;
    }
    spawnGrain(note) {
        if (this.activeVoiceIndices.length >= this.MAX_VOICES) {
            // Simple voice stealing: kill oldest
            // Since we push new indices, index 0 is likely oldest
            this.killVoice(0);
        }

        const buf = this.trackBuffers.get(note.trackId);
        if(!buf) return;
        let v = null;
        
        // Find free voice slot
        for(let i=0; i<64; i++) {
             if(!this.voices[i].active) { 
                 v = this.voices[i]; 
                 this.activeVoiceIndices.push(i); 
                 break; 
             }
        }
        
        if(!v) return; 
        
        let pos = note.params.position;
        if(note.params.spray > 0) pos += (Math.random()*2-1)*note.params.spray;
        
        v.active = true; v.trackId = note.trackId; v.buffer = buf; v.bufferLength = buf.length;
        v.position = Math.max(0, Math.min(1, pos)); v.phase = 0;
        
        // Use global sampleRate if available, else 44100
        const sr = sampleRate || 44100;
        v.grainLength = Math.max(128, Math.floor((note.params.grainSize||0.1) * sr));
        
        v.invGrainLength = 4095 / v.grainLength;
        v.pitch = note.params.pitch||1; v.velocity = note.params.velocity||1;
        v.releasing = false; v.releaseAmp = 1.0;
    }
    killVoice(idx) {
        const vIdx = this.activeVoiceIndices[idx];
        this.voices[vIdx].active = false;
        // Swap with last
        const last = this.activeVoiceIndices.pop();
        if (idx < this.activeVoiceIndices.length) {
            this.activeVoiceIndices[idx] = last;
        }
    }
    stopAllVoices() { for(let i=0; i<this.activeVoiceIndices.length; i++) this.voices[this.activeVoiceIndices[i]].releasing = true; }
    stopTrack(id) { 
        for(let i=0; i<this.activeVoiceIndices.length; i++) {
            const v = this.voices[this.activeVoiceIndices[i]];
            if(v.trackId === id) v.releasing = true; 
        }
    }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}