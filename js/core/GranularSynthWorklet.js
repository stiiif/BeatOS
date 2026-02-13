// Granular SynthWorklet - Fixed Silence on Manual Sample Load
import { MAX_TRACKS } from '../utils/constants.js';
import { GranularLogic } from '../utils/GranularLogic.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        
        // Track buffer identity to detect changes manually
        this.bufferVersionMap = new Map(); 
        this.pendingLoads = new Map();
        
        // Track last bar start time for Reset On Bar logic
        this.lastBarStartTimes = new Map();
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
                console.log('[GranularSynthWorklet] ✅ DSP Engine Ready');
            } catch (error) {
                console.error('[GranularSynthWorklet] Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
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
        const modCtx = { siblings: track.lfos, audioEngine: this.audioEngine, tracks: this.audioEngine._tracks };
        track.lfos.forEach((lfo, idx) => {
            if (lfo.amount === 0) return;
            modCtx.selfIndex = idx;
            const v = lfo.getValue(now, 120, modCtx);
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

        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0, relGrain:0, edgeCrunch: 0, orbit: 0, stereoSpread: 0 };
        const noteModCtx = { siblings: track.lfos, audioEngine: this.audioEngine, tracks: this.audioEngine._tracks, stepIndex: stepIndex };
        track.lfos.forEach((lfo, idx) => {
            noteModCtx.selfIndex = idx;
            const v = lfo.getValue(time, 120, noteModCtx);
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

        // --- HANDLE SCAN RESET LOGIC ---
        
        // 1. Update Bar Start if applicable
        if (stepIndex === 0) {
            this.lastBarStartTimes.set(track.id, time);
        }

        // 2. Determine effective Scan Time
        let scanTime = time;
        if (track.resetOnTrig) {
            scanTime = 0; // Reset scan offset to 0 for this note
        } else if (track.resetOnBar) {
            const barStart = this.lastBarStartTimes.get(track.id) || time;
            scanTime = Math.max(0, time - barStart);
        }
        
        // 3. Calculate Effective Position
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
                    // We pass the RAW scan speed so the DSP can continue the motion.
                    // IMPORTANT: The DSP `spawnGrain` uses `timeSinceStart * scanSpeed` from the `absPos` anchor.
                    // This creates the correct motion relative to the reset point.
                    scanSpeed: p.scanSpeed + mod.scanSpeed,
                    // Pass the calculated boundaries to confine the scan
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
                    orbit: Math.max(0, Math.min(1, (p.orbit || 0) + mod.orbit)),
                    stereoSpread: Math.max(0, Math.min(1, (p.stereoSpread || 0) + mod.stereoSpread))
                }
            }
        });

        // Pass stepIndex to visualizer
        scheduleVisualDrawCallback(time, track.id, stepIndex);
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

        // OPT: Pre-allocate voice pool as flat typed arrays for cache-friendly access
        // Each voice has fixed-size properties stored contiguously
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
            cleanMode: false, edgeCrunch: 0.0, orbit: 0.0,
            panL: 1.0, panR: 1.0 // Equal-power pan gains
        }));
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map();
        
        this.lastReportedCount = 0;
        this._rngState = 0xCAFEBABE;
        
        // Smoothed voice count for amplitude scaling (avoids crackle from instant jumps)
        this._smoothedVoiceCount = 0;

        // OPT: Track which output indices have active voices this block
        // Avoids clearing/clipping all 32 outputs when only a few are active
        this._dirtyOutputs = new Uint8Array(32);

        // OPT: Free-list for activeNotes to avoid splice() GC pressure
        this._notePool = [];

        this.LUT_SIZE = 4096;
        this.windowLUT = new Float32Array(this.LUT_SIZE);
        for(let i=0; i<this.LUT_SIZE; i++) {
            const phase = i/(this.LUT_SIZE-1);
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }

        // OPT: Pre-compute soft clip LUT to avoid division in inner loop
        // Maps input range [-4, 4] to soft-clipped output via x/(1+|x|)
        this.CLIP_LUT_SIZE = 8192;
        this.CLIP_LUT_HALF = this.CLIP_LUT_SIZE >>> 1;
        this.CLIP_RANGE = 4.0; // input range [-4, 4]
        this.CLIP_SCALE = this.CLIP_LUT_HALF / this.CLIP_RANGE;
        this.clipLUT = new Float32Array(this.CLIP_LUT_SIZE);
        for (let i = 0; i < this.CLIP_LUT_SIZE; i++) {
            const x = (i - this.CLIP_LUT_HALF) / this.CLIP_SCALE;
            this.clipLUT[i] = x / (1.0 + (x < 0 ? -x : x));
        }
        
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.trackBuffers.set(Number(data.trackId), data.buffer); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes.length = 0; break;
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

    // OPT: Inline soft clip via LUT — no division, no branching
    softClip(x) {
        // Clamp to LUT range and look up
        let i = (x * this.CLIP_SCALE + this.CLIP_LUT_HALF) | 0;
        if (i < 0) i = 0;
        else if (i >= this.CLIP_LUT_SIZE) i = this.CLIP_LUT_SIZE - 1;
        return this.clipLUT[i];
    }

    handleNoteOn(data) {
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
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        const invSR = 1.0 / sampleRate;
        const blockEnd = now + frameCount * invSR;

        // OPT: Only clear outputs that will be written to (tracked via _dirtyOutputs)
        // Reset dirty flags
        this._dirtyOutputs.fill(0);

        // --- 1. SCHEDULER ---
        // OPT: Swap-and-pop removal instead of splice()
        let noteLen = this.activeNotes.length;
        let i = noteLen - 1;
        while (i >= 0) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) {
                // Swap-and-pop
                noteLen--;
                if (i < noteLen) {
                    this.activeNotes[i] = this.activeNotes[noteLen];
                    this.activeNotes.length = noteLen;
                    // Re-check i (swapped element now occupies this slot)
                    continue;
                }
                // Removed the tail element — no swap needed, just shrink
                this.activeNotes.length = noteLen;
                i--;
                continue;
            }
            if (now >= note.startTime) {
                const density = note.params.density || 20;
                const interval = 1.0 / (density > 0.1 ? density : 0.1);
                let spawnLimit = 5;
                while (note.nextGrainTime < blockEnd && spawnLimit > 0) {
                    if (note.nextGrainTime >= now) {
                        if (this.activeVoiceIndices.length < this.MAX_VOICES) {
                            this.spawnGrain(note);
                        }
                    }
                    note.nextGrainTime += interval;
                    spawnLimit--;
                }
            }
            i--;
        }

        if (this.activeVoiceIndices.length !== this.lastReportedCount) {
            this.lastReportedCount = this.activeVoiceIndices.length;
            this.port.postMessage({ type: 'grainCount', count: this.lastReportedCount });
        }

        if (this.activeVoiceIndices.length === 0) return true;

        // Smooth voice count to prevent amplitude jumps (crackle source)
        const actualCount = this.activeVoiceIndices.length;
        this._smoothedVoiceCount += (actualCount - this._smoothedVoiceCount) * 0.05; // ~20ms smoothing
        const smoothCount = Math.max(1, this._smoothedVoiceCount);
        
        const normalScale = 1.0 / (1.0 + (smoothCount * 0.15));
        const cleanScale = 1.0 / smoothCount;

        // --- 2. DSP LOOP ---
        const wLUT = this.windowLUT;
        const lutMax = this.LUT_SIZE - 1;

        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const vIdx = this.activeVoiceIndices[i];
            const voice = this.voices[vIdx];
            const tId = voice.trackId;
            const trackOut = outputs[tId];
            
            if (!trackOut || !voice.buffer || voice.bufferLength < 2) { 
                this.killVoice(i); 
                continue; 
            }

            // OPT: Clear output channels on first touch only
            if (!this._dirtyOutputs[tId]) {
                this._dirtyOutputs[tId] = 1;
                trackOut[0].fill(0);
                if (trackOut[1]) trackOut[1].fill(0);
            }
            
            const L = trackOut[0], R = trackOut[1];
            const buf = voice.buffer, bufLen = voice.bufferLength;
            const pitch = voice.pitch, gLen = voice.grainLength, invGL = voice.invGrainLength;
            const start = voice.position * bufLen;
            const baseAmp = voice.velocity;
            const trackScale = voice.cleanMode ? cleanScale : normalScale;
            const vPanL = voice.panL, vPanR = voice.panR;

            // OPT: Pre-compute edgeCrunch outside inner loop
            const hasEdgeCrunch = !voice.cleanMode && voice.edgeCrunch > 0;
            const maxOverflow = hasEdgeCrunch ? 1.0 + (voice.edgeCrunch * voice.edgeCrunch * voice.edgeCrunch * bufLen) : 0;

            let ph = voice.phase, amp = voice.releaseAmp, rel = voice.releasing;

            // OPT: Hoist bufLen-1 for wrap check
            const bufLenM1 = bufLen - 1;

            for (let j = 0; j < frameCount; j++) {
                if (rel) { 
                    amp -= 0.003; // ~7ms fade at 48kHz — smooth enough to avoid clicks
                    if (amp <= 0) { this.killVoice(i); break; } 
                }
                
                // When grain reaches its end, enter release (freeze phase at last valid position)
                if (ph >= gLen) { 
                    if (!rel) rel = true;
                    ph = gLen - 1; // Clamp to last valid sample
                }
                
                let rPos = start + (ph * pitch);
                
                // OPT: Replace while-loops with single modulo for wrap
                if (rPos >= bufLen || rPos < 0) {
                    rPos = ((rPos % bufLen) + bufLen) % bufLen;
                }
                
                let idx = rPos | 0;
                let frac = rPos - idx;
                
                if (hasEdgeCrunch) {
                    if (frac < -maxOverflow) frac = -maxOverflow;
                    else if (frac > maxOverflow) frac = maxOverflow;
                }

                // OPT: Direct array access with bounds check instead of || 0
                const s1 = idx <= bufLenM1 ? buf[idx] : 0;
                const idx2 = idx < bufLenM1 ? idx + 1 : 0;
                const s2 = buf[idx2];
                
                const sample = s1 + frac * (s2 - s1);

                // OPT: Bitwise OR for floor, bounded by lutMax
                let winIdx = (ph * invGL) | 0;
                if (winIdx > lutMax) winIdx = lutMax;
                const win = wLUT[winIdx];
                
                const val = sample * win * baseAmp * amp * trackScale;
                
                L[j] += val * vPanL; 
                if (R) R[j] += val * vPanR;
                if (!rel) ph++; // Only advance phase if not releasing
            }
            voice.phase = ph; voice.releasing = rel; voice.releaseAmp = amp;
        }

        // --- 3. SOFT CLIPPER ---
        // OPT: Only clip dirty (active) outputs, use LUT instead of division
        const clipScale = this.CLIP_SCALE;
        const clipHalf = this.CLIP_LUT_HALF;
        const clipSize = this.CLIP_LUT_SIZE;
        const clipSizeM1 = clipSize - 1;
        const cLUT = this.clipLUT;

        for (let o = 0; o < 32; o++) {
            if (!this._dirtyOutputs[o]) continue;
            const outCh = outputs[o];
            if (!outCh) continue;
            const outL = outCh[0];
            if (!outL) continue;
            const outR = outCh[1];
            
            for (let j = 0; j < frameCount; j++) {
                // OPT: Inline LUT clip — no division, no isNaN, no Math.abs
                let ci = (outL[j] * clipScale + clipHalf) | 0;
                if (ci < 0) ci = 0; else if (ci > clipSizeM1) ci = clipSizeM1;
                outL[j] = cLUT[ci];
                
                if (outR) {
                    ci = (outR[j] * clipScale + clipHalf) | 0;
                    if (ci < 0) ci = 0; else if (ci > clipSizeM1) ci = clipSizeM1;
                    outR[j] = cLUT[ci];
                }
            }
        }

        return true;
    }

    spawnGrain(note) {
        const buf = this.trackBuffers.get(Number(note.trackId));
        if(!buf || buf.length < 2) return;
        
        let v = null;
        for(let i=0; i<this.MAX_VOICES; i++) {
            if(!this.voices[i].active) { 
                v = this.voices[i]; 
                this.activeVoiceIndices.push(i); 
                break; 
            }
        }
        if(!v) return; 
        
        // --- STRICT WINDOW WRAPPING LOGIC ---
        let pos = note.basePosition;
        
        const timeSinceStart = currentTime - note.startTime;
        pos += note.params.scanSpeed * timeSinceStart;
        
        const wStart = note.params.windowStart;
        const wEnd = note.params.windowEnd;
        const wSize = wEnd - wStart;
        
        if (wSize > 0.0001) {
            let relPos = pos - wStart;
            let wrappedRel = ((relPos % wSize) + wSize) % wSize;
            pos = wStart + wrappedRel;
        } else {
            pos = wStart;
        }
        
        if (note.params.orbit > 0) {
            pos += (this.random() - 0.5) * note.params.orbit;
            if (pos < wStart) pos += wSize;
            if (pos > wEnd) pos -= wSize;
        } else {
            pos += (this.random() * 0.0001); 
        }

        if(note.params.spray > 0) {
            pos += (this.random()*2-1)*note.params.spray;
        }
        
        // OPT: Branchless clamp
        pos = pos < 0 ? 0 : pos > 1 ? 1 : pos;
        
        v.active = true; 
        v.trackId = note.trackId; 
        v.buffer = buf; 
        v.bufferLength = buf.length;
        v.position = pos; 
        v.phase = 0;

        const gLen = (note.params.grainSize || 0.1) * sampleRate;
        v.grainLength = gLen > 128 ? (gLen | 0) : 128;
        v.invGrainLength = (this.LUT_SIZE - 1) / v.grainLength;
        v.pitch = note.params.pitch || 1; 
        v.velocity = note.params.velocity || 1;
        v.releasing = false; 
        v.releaseAmp = 1.0;
        v.cleanMode = !!note.params.cleanMode;
        v.edgeCrunch = note.params.edgeCrunch || 0;
        v.orbit = note.params.orbit || 0;
        
        // Per-grain stereo placement: random pan within ±spread, equal-power pan law
        const spread = note.params.stereoSpread || 0;
        if (spread > 0) {
            const panPos = (this.random() * 2 - 1) * spread; // -spread to +spread
            // Equal-power: L = cos(θ), R = sin(θ) where θ = (pan+1)/2 * π/2
            const theta = (panPos + 1) * 0.25 * Math.PI; // 0 to π/2
            v.panL = Math.cos(theta);
            v.panR = Math.sin(theta);
        } else {
            v.panL = 0.7071; // 1/√2 — center, equal power
            v.panR = 0.7071;
        }
    }
    
    killVoice(idx) {
        const vIdx = this.activeVoiceIndices[idx];
        this.voices[vIdx].active = false;
        const last = this.activeVoiceIndices.pop();
        if (idx < this.activeVoiceIndices.length) this.activeVoiceIndices[idx] = last;
    }
    
    stopAllVoices() { 
        for(let i=0; i<this.activeVoiceIndices.length; i++) {
            this.voices[this.activeVoiceIndices[i]].releasing = true; 
        }
    }
    
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