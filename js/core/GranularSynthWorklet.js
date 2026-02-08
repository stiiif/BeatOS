// Granular SynthWorklet - Fixed Silence on Manual Sample Load
import { MAX_TRACKS } from '../utils/constants.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        
        // Use a WeakMap to track which buffer is currently loaded in the worklet for each track
        this.trackBufferCache = new WeakMap();
        this.pendingLoads = new Map();
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) throw new Error('AudioContext not available');
            
            try {
                const workletCode = this.getWorkletCode();
                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const blobURL = URL.createObjectURL(blob);
                
                await audioCtx.audioWorklet.addModule(blobURL);
                URL.revokeObjectURL(blobURL);
                
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts,
                    processorOptions: {}
                });
                
                this.workletNode.port.onmessage = (event) => {
                    if (event.data.type === 'grainCount') {
                        this.activeGrains = event.data.count;
                    }
                };

                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
                console.log('[GranularSynthWorklet] ✅ Engine Ready');
            } catch (error) {
                console.error('[GranularSynthWorklet] Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    /**
     * CRITICAL FIX: Ensures the audio data is sent to the DSP thread.
     * If the buffer in the Track object doesn't match our cache, we re-send it.
     */
    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = track.id;
        
        // If track has no buffer, there's nothing to load
        if (!track.buffer) return;

        // Check if this EXACT buffer instance is already known to the worklet
        const cachedBuffer = this.trackBufferCache.get(track);
        if (cachedBuffer === track.buffer) {
            return; // Already synchronized
        }

        // If a load for this track is already in progress, wait for it
        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            // Get the raw Float32 data
            const channelData = track.buffer.getChannelData(0);
            
            // We must copy the data because Transferables empty the original array on the main thread
            const bufferCopy = new Float32Array(channelData);
            
            // Send to Worklet Processor
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: { trackId: Number(trackId), buffer: bufferCopy }
            }, [bufferCopy.buffer]); // Transfer ownership for zero-copy speed
            
            console.log(`[GranularSynthWorklet] Buffer synchronized for Track ${trackId} (${bufferCopy.length} samples)`);
            
            resolve();
            this.pendingLoads.delete(trackId);
        });

        await loadPromise;
        // Update cache with the new buffer reference
        this.trackBufferCache.set(track, track.buffer);
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
            scheduleVisualDrawCallback(time, track.id);
            return;
        }

        if (!this.isInitialized) await this.init();
        if (!this.audioEngine.getContext() || !track.buffer || !track.bus) return;

        // FORCE BUFFER CHECK: Ensure the worklet has the current track.buffer
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

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: Number(track.id),
                time: time,
                duration: (p.relGrain || 0.4) + mod.relGrain,
                stepIndex: stepIndex,
                params: {
                    position: p.position + mod.position, 
                    scanSpeed: p.scanSpeed + mod.scanSpeed,
                    density: Math.max(1, (p.density || 20) + mod.density),
                    grainSize: Math.max(0.005, (p.grainSize || 0.1) + mod.grainSize),
                    overlap: Math.max(0, (p.overlap || 0) + mod.overlap),
                    pitch: Math.max(0.01, (p.pitch || 1.0) + mod.pitch),
                    velocity: gainMult,
                    spray: Math.max(0, (p.spray || 0) + mod.spray),
                    resetOnBar: track.resetOnBar,
                    resetOnTrig: track.resetOnTrig,
                    cleanMode: track.cleanMode,
                    edgeCrunch: Math.max(0, Math.min(1, (p.edgeCrunch || 0) + mod.edgeCrunch)),
                    orbit: Math.max(0, Math.min(1, (p.orbit || 0) + mod.orbit))
                }
            }
        });

        scheduleVisualDrawCallback(time, track.id);
    }
    
    stopAll() {
        if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' });
        this.activeGrains = 0;
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
        this.MAX_VOICES = 64;
        this.safetyLimit = 400; 
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
            cleanMode: false, edgeCrunch: 0.0, orbit: 0.0
        }));
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map();
        this.trackPlayheads = new Float32Array(32); 
        this.lastReportedCount = 0;

        this._rngState = 0xCAFEBABE;

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
                case 'setBuffer': this.trackBuffers.set(Number(data.trackId), data.buffer); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(Number(data.trackId)); break;
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
        const trackId = Number(data.trackId);
        const params = data.params;
        
        if (params.resetOnTrig) {
            this.trackPlayheads[trackId] = 0;
        } else if (params.resetOnBar && data.stepIndex === 0) {
            this.trackPlayheads[trackId] = 0;
        }

        this.activeNotes.push({
            trackId: trackId, 
            startTime: data.time, 
            duration: data.duration,
            params: params, 
            nextGrainTime: data.time
        });
    }

    process(inputs, outputs, parameters) {
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        
        for (let o = 0; o < outputs.length; o++) {
            if (outputs[o] && outputs[o][0]) outputs[o][0].fill(0);
            if (outputs[o] && outputs[o][1]) outputs[o][1].fill(0);
        }

        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let interval = 1 / Math.max(0.1, note.params.density || 20);
                
                let spawnLimit = 3;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && spawnLimit > 0) {
                    if (note.nextGrainTime >= now) {
                        if (this.activeVoiceIndices.length < this.MAX_VOICES) {
                            this.spawnGrain(note);
                        }
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
        }

        if (this.activeVoiceIndices.length !== this.lastReportedCount) {
            this.lastReportedCount = this.activeVoiceIndices.length;
            this.port.postMessage({ type: 'grainCount', count: this.lastReportedCount });
        }

        if (this.activeVoiceIndices.length === 0) {
            this.updatePlayheads(frameCount);
            return true;
        }

        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const vIdx = this.activeVoiceIndices[i];
            const voice = this.voices[vIdx];
            const trackOut = outputs[voice.trackId];
            if (!trackOut || !voice.buffer || voice.bufferLength === 0) { this.killVoice(i); continue; }
            
            const L = trackOut[0], R = trackOut[1];
            const buf = voice.buffer, bufLen = voice.bufferLength;
            const pitch = voice.pitch, gLen = voice.grainLength, invGL = voice.invGrainLength;
            const start = voice.position * bufLen;
            const baseAmp = voice.velocity;
            
            const activeCount = Math.max(1, this.activeVoiceIndices.length);
            const trackScale = voice.cleanMode ? (1.0 / activeCount) : (1.0 / (1.0 + (activeCount * 0.15)));

            let ph = voice.phase, amp = voice.releaseAmp, rel = voice.releasing;

            for (let j = 0; j < frameCount; j++) {
                if (rel) { amp -= 0.015; if (amp <= 0) { this.killVoice(i); break; } }
                if (ph >= gLen) { this.killVoice(i); break; }
                
                let rPos = start + (ph * pitch);
                let idx, frac;

                if (voice.cleanMode) {
                    while (rPos >= bufLen) rPos -= bufLen;
                    while (rPos < 0) rPos += bufLen;
                    idx = rPos | 0;
                    frac = rPos - idx;
                } else {
                    idx = rPos | 0;
                    if (idx >= bufLen) idx %= bufLen;
                    if (idx < 0) idx = (idx % bufLen + bufLen) % bufLen;
                    let safeFrac = rPos - Math.floor(rPos); 
                    
                    if (voice.edgeCrunch > 0) {
                        let rawFrac = rPos - idx;
                        let maxOverflow = 1.0 + (voice.edgeCrunch * voice.edgeCrunch * voice.edgeCrunch * bufLen);
                        frac = rawFrac < 0 ? Math.max(rawFrac, -maxOverflow) : Math.min(rawFrac, maxOverflow);
                        if (voice.edgeCrunch < 0.001) frac = safeFrac;
                    } else {
                        frac = safeFrac; 
                    }
                }
                
                const s1 = buf[idx] || 0;
                let idx2 = (idx + 1) % bufLen;
                const s2 = buf[idx2] || 0;
                
                const sample = s1 + frac * (s2 - s1);
                const winIdx = Math.min(this.LUT_SIZE - 1, (ph * invGL) | 0);
                const win = this.windowLUT[winIdx] || 0;
                
                const val = sample * win * baseAmp * amp * trackScale;
                
                // Prevent NaN Poisoning
                if (!isNaN(val)) {
                    L[j] += val; 
                    if (R) R[j] += val;
                }
                ph++;
            }
            voice.phase = ph; voice.releasing = rel; voice.releaseAmp = amp;
        }

        // Soft Clipper (Prevent Output NaN)
        for (let o = 0; o < outputs.length; o++) {
            const outL = outputs[o][0];
            const outR = outputs[o][1];
            if (!outL) continue;
            for (let j = 0; j < frameCount; j++) {
                const sL = outL[j];
                const sR = outR[j] || 0;
                outputs[o][0][j] = isNaN(sL) ? 0 : sL / (1.0 + Math.abs(sL));
                if (outR) outputs[o][1][j] = isNaN(sR) ? 0 : sR / (1.0 + Math.abs(sR));
            }
        }

        this.updatePlayheads(frameCount);
        return true;
    }

    updatePlayheads(frameCount) {
        for (let tId = 0; tId < 32; tId++) {
            let targetSpeed = 0;
            for (let i = this.activeNotes.length - 1; i >= 0; i--) {
                if (this.activeNotes[i].trackId === tId) {
                    targetSpeed = this.activeNotes[i].params.scanSpeed;
                    break;
                }
            }
            this.trackPlayheads[tId] += (targetSpeed * (frameCount / sampleRate));
            if (this.trackPlayheads[tId] > 1.0) this.trackPlayheads[tId] -= 1.0;
            if (this.trackPlayheads[tId] < -1.0) this.trackPlayheads[tId] += 1.0;
        }
    }

    spawnGrain(note) {
        const buf = this.trackBuffers.get(Number(note.trackId));
        if(!buf || buf.length === 0) return;
        let v = null;
        for(let i=0; i<this.MAX_VOICES; i++) if(!this.voices[i].active) { v = this.voices[i]; this.activeVoiceIndices.push(i); break; }
        if(!v) return; 
        
        let pos = note.params.position + this.trackPlayheads[note.trackId];
        while (pos >= 1.0) pos -= 1.0;
        while (pos < 0.0) pos += 1.0;
        
        if (note.params.orbit > 0) {
            const jitter = (this.random() - 0.5) * note.params.orbit;
            pos += jitter;
            if (pos < 0) pos += 1.0;
            if (pos > 1) pos -= 1.0;
        } else {
            pos += (this.random() * 0.0001); 
        }

        if(note.params.spray > 0) pos += (this.random()*2-1)*note.params.spray;
        
        v.active = true; v.trackId = note.trackId; v.buffer = buf; v.bufferLength = buf.length;
        v.position = Math.max(0, Math.min(1, pos)); 
        v.phase = 0;
        v.grainLength = Math.max(128, Math.floor((note.params.grainSize||0.1) * sampleRate));
        v.invGrainLength = (this.LUT_SIZE - 1) / v.grainLength;
        v.pitch = note.params.pitch||1; v.velocity = note.params.velocity||1;
        v.releasing = false; v.releaseAmp = 1.0;
        v.cleanMode = note.params.cleanMode;
        v.edgeCrunch = note.params.edgeCrunch;
        v.orbit = note.params.orbit;
    }
    killVoice(idx) {
        const vIdx = this.activeVoiceIndices[idx];
        this.voices[vIdx].active = false;
        const last = this.activeVoiceIndices.pop();
        if (idx < this.activeVoiceIndices.length) this.activeVoiceIndices[idx] = last;
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