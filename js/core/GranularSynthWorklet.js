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
        
        this.bufferVersionMap = new Map(); 
        this.pendingLoads = new Map();
        this.lastBarStartTimes = new Map();

        // A1: Pre-allocated reusable objects — zero alloc per step trigger
        this._mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, pitchSemi:0, pitchFine:0, chordSpread:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0, relGrain:0, edgeCrunch:0, orbit:0, stereoSpread:0 };
        this._busMod = { filter:0, hpFilter:0, volume:0, pan:0 };
        this._noteModCtx = { siblings: null, audioEngine: null, tracks: null, selfIndex: 0, stepIndex: 0 };
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

        // A1: Reuse pre-allocated mod object
        const mod = this._busMod;
        mod.filter = 0; mod.hpFilter = 0; mod.volume = 0; mod.pan = 0;
        
        const modCtx = this._noteModCtx;
        modCtx.siblings = track.lfos;
        modCtx.audioEngine = this.audioEngine;
        modCtx.tracks = this.audioEngine._tracks;
        // Provide global step position for Automizer modulators
        modCtx.globalStepFrac = this.audioEngine._scheduler ? (this.audioEngine._scheduler.totalStepsPlayed || 0) : 0;
        
        // B8: for-loop instead of forEach
        const lfos = track.lfos;
        for (let idx = 0; idx < lfos.length; idx++) {
            const lfo = lfos[idx];
            if (lfo.amount === 0) continue;
            modCtx.selfIndex = idx;
            const v = lfo.getValue(now, 120, modCtx);
            const targets = lfo.targets;
            if (targets && targets.length > 0) {
                for (let ti = 0; ti < targets.length; ti++) {
                    const t = targets[ti];
                    if (t === 'filter') mod.filter += v * 5000;
                    else if (t === 'hpFilter') mod.hpFilter += v * 2000;
                    else if (t === 'volume') mod.volume += v * 0.5;
                    else if (t === 'pan') mod.pan += v;
                }
            } else if (lfo.target) {
                const t = lfo.target;
                if (t === 'filter') mod.filter += v * 5000;
                else if (t === 'hpFilter') mod.hpFilter += v * 2000;
                else if (t === 'volume') mod.volume += v * 0.5;
                else if (t === 'pan') mod.pan += v;
            }
        }

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

        // A1: Reuse pre-allocated mod object — zero alloc
        const mod = this._mod;
        mod.position=0; mod.spray=0; mod.density=0; mod.grainSize=0; mod.pitch=0;
        mod.pitchSemi=0; mod.pitchFine=0; mod.chordSpread=0; mod.sampleStart=0;
        mod.sampleEnd=0; mod.overlap=0; mod.scanSpeed=0; mod.relGrain=0;
        mod.edgeCrunch=0; mod.orbit=0; mod.stereoSpread=0;
        
        const noteModCtx = this._noteModCtx;
        noteModCtx.siblings = track.lfos;
        noteModCtx.audioEngine = this.audioEngine;
        noteModCtx.tracks = this.audioEngine._tracks;
        noteModCtx.stepIndex = stepIndex;
        noteModCtx.globalStepFrac = this.audioEngine._scheduler ? (this.audioEngine._scheduler.totalStepsPlayed || 0) : 0;
        
        // B8: for-loop instead of forEach
        const lfos = track.lfos;
        for (let idx = 0; idx < lfos.length; idx++) {
            const lfo = lfos[idx];
            noteModCtx.selfIndex = idx;
            const v = lfo.getValue(time, 120, noteModCtx);
            const targets = lfo.targets;
            if (targets && targets.length > 0) {
                for (let ti = 0; ti < targets.length; ti++) {
                    const tgt = targets[ti];
                    if (mod[tgt] !== undefined) mod[tgt] += v;
                }
            } else if (lfo.target && mod[lfo.target] !== undefined) {
                mod[lfo.target] += v;
            }
        }

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

        // A2: Mutate scanSpeed to 0, compute position, restore — no spread alloc
        const savedScanMod = mod.scanSpeed;
        mod.scanSpeed = 0;
        const { absPos, actStart, actEnd } = GranularLogic.calculateEffectivePosition(p, mod, time, 0);
        mod.scanSpeed = savedScanMod;
        
        // 3. Determine the scan time origin for the worklet
        // Worklet computes: pos = anchor + scanSpeed * (currentTime - scanOriginTime)
        let scanOriginTime;
        if (track.resetOnTrig) {
            // Reset on every trigger: scan from 0 each note
            scanOriginTime = time;
        } else if (track.resetOnBar) {
            // Reset on bar: scan from bar start
            scanOriginTime = this.lastBarStartTimes.get(track.id) || time;
        } else {
            // Normal: continuous scan from audio context start (time 0)
            scanOriginTime = 0;
        }

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: Number(track.id),
                time: time,
                scanOriginTime: scanOriginTime,
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
                    
                    // Musical pitch system — compute in worklet per-grain
                    pitchSemi: (p.pitchSemi || 0) + (mod.pitchSemi || 0) + (mod.pitch || 0) * 12, // legacy pitch mod → semitones
                    pitchFine: (p.pitchFine || 0) + (mod.pitchFine || 0),
                    scaleRoot: p.scaleRoot || 0,
                    scaleType: p.scaleType || 'chromatic',
                    chordType: p.chordType || 'unison',
                    chordSpread: Math.max(0, Math.min(3, (p.chordSpread || 0) + (mod.chordSpread || 0))),
                    chordInversion: p.chordInversion || 0,
                    voiceMode: p.voiceMode || 'random',
                    // Per-step pitch override
                    _stepPitches: track.stepPitches ? track.stepPitches[stepIndex] : null,
                    // Legacy fallback: flat ratio for backward compat
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
// ═══ Musical Pitch Tables (inlined for worklet) ═══
const _SCALES = {
    chromatic:[0,1,2,3,4,5,6,7,8,9,10,11], major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10],
    dorian:[0,2,3,5,7,9,10], phrygian:[0,1,3,5,7,8,10], lydian:[0,2,4,6,7,9,11],
    mixolydian:[0,2,4,5,7,9,10], pentatonic:[0,2,4,7,9], minPent:[0,3,5,7,10],
    blues:[0,3,5,6,7,10], wholetone:[0,2,4,6,8,10], diminished:[0,1,3,4,6,7,9,10],
    japanese:[0,1,5,7,8], arabic:[0,1,4,5,7,8,11], hungarian:[0,2,3,6,7,8,11],
    harmonicMin:[0,2,3,5,7,8,11]
};
const _CHORDS = {
    unison:[0], octaves:[0,12], fifth:[0,7], major:[0,4,7], minor:[0,3,7],
    sus2:[0,2,7], sus4:[0,5,7], dim:[0,3,6], aug:[0,4,8],
    maj7:[0,4,7,11], min7:[0,3,7,10], dom7:[0,4,7,10],
    add9:[0,4,7,14], min9:[0,3,7,10,14], stack4:[0,5,10], stack5:[0,7,14], cluster:[0,1,2]
};

function _quantize(semi, root, scale) {
    if (!scale || scale.length === 12) return semi;
    const rel = semi - root;
    const oct = Math.floor(rel / 12);
    const wo = ((rel % 12) + 12) % 12;
    let best = scale[0], bestD = 12;
    for (let i = 0; i < scale.length; i++) {
        const d = Math.min(Math.abs(wo - scale[i]), 12 - Math.abs(wo - scale[i]));
        if (d < bestD) { bestD = d; best = scale[i]; }
    }
    return root + oct * 12 + best;
}

function _buildVoicings(chord, inv, spread) {
    const base = (_CHORDS[chord] || _CHORDS.unison).slice();
    const n = Math.min(inv, base.length - 1);
    for (let i = 0; i < n; i++) base[i] += 12;
    base.sort((a,b) => a - b);
    if (spread <= 0) return base;
    const v = [];
    for (let o = 0; o <= spread; o++) for (const i of base) v.push(i + o * 12);
    return v;
}

// ═══ FIX 2: Pitch ratio LUT — covers -48 to +48 semitones at 0.01 cent resolution ═══
// Index = (semitones + 48) * 100  → range [0, 9600]
const _PITCH_LUT_SIZE = 9601;
const _PITCH_LUT_OFFSET = 4800; // +48 semitones * 100
const _PITCH_LUT = new Float32Array(_PITCH_LUT_SIZE);
for (let i = 0; i < _PITCH_LUT_SIZE; i++) {
    _PITCH_LUT[i] = Math.pow(2, (i - _PITCH_LUT_OFFSET) / 1200);
}
function _pitchRatio(semitones, cents) {
    const idx = ((semitones * 100 + cents) + _PITCH_LUT_OFFSET) | 0;
    if (idx <= 0) return _PITCH_LUT[0];
    if (idx >= _PITCH_LUT_SIZE - 1) return _PITCH_LUT[_PITCH_LUT_SIZE - 1];
    return _PITCH_LUT[idx];
}

// ═══ FIX 3: Equal-power pan LUT — 256 entries for panPos [-1, +1] ═══
const _PAN_LUT_SIZE = 256;
const _PAN_L = new Float32Array(_PAN_LUT_SIZE);
const _PAN_R = new Float32Array(_PAN_LUT_SIZE);
for (let i = 0; i < _PAN_LUT_SIZE; i++) {
    const panPos = (i / (_PAN_LUT_SIZE - 1)) * 2 - 1; // -1 to +1
    const theta = (panPos + 1) * 0.25 * Math.PI;
    _PAN_L[i] = Math.cos(theta);
    _PAN_R[i] = Math.sin(theta);
}
function _panLookup(panPos) {
    let idx = ((panPos + 1) * 0.5 * (_PAN_LUT_SIZE - 1)) | 0;
    if (idx < 0) idx = 0; else if (idx >= _PAN_LUT_SIZE) idx = _PAN_LUT_SIZE - 1;
    return idx;
}

class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 256;
        this.safetyLimit = 800;
        this._grainCounter = 0; // for chord cycle mode

        // Pre-allocate voice pool
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
            cleanMode: false, edgeCrunch: 0.0, orbit: 0.0,
            panL: 1.0, panR: 1.0
        }));
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map();
        
        // FIX 4: Free-list stack for O(1) voice allocation
        this._freeList = new Int16Array(this.MAX_VOICES);
        this._freeCount = this.MAX_VOICES;
        for (let i = 0; i < this.MAX_VOICES; i++) this._freeList[i] = this.MAX_VOICES - 1 - i; // top of stack = index 0
        
        this.lastReportedCount = 0;
        this._rngState = 0xCAFEBABE;
        
        // Per-track smoothed voice counts for independent amplitude scaling
        this._perTrackSmoothed = new Float32Array(32);
        this._perTrackCount = new Uint16Array(32);
        
        // FIX 6: Pre-computed per-track amplitude scales
        this._perTrackNormalScale = new Float32Array(32).fill(1.0);
        this._perTrackCleanScale = new Float32Array(32).fill(1.0);

        this._dirtyOutputs = new Uint8Array(32);
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
                case 'setMaxGrains': 
                    this.safetyLimit = data.max;
                    const oldMax = this.voices.length;
                    // Grow voice pool if needed
                    while (this.voices.length < data.max && this.voices.length < 1024) {
                        const id = this.voices.length;
                        this.voices.push({
                            id, active: false, buffer: null, bufferLength: 0,
                            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
                            trackId: 0, releasing: false, releaseAmp: 1.0, invGrainLength: 0,
                            cleanMode: false, edgeCrunch: 0.0, orbit: 0.0,
                            panL: 1.0, panR: 1.0
                        });
                    }
                    this.MAX_VOICES = Math.min(data.max, this.voices.length);
                    // Rebuild free-list
                    const newFree = new Int16Array(this.MAX_VOICES);
                    let fc = 0;
                    for (let i = 0; i < this.MAX_VOICES; i++) {
                        if (!this.voices[i].active) newFree[fc++] = i;
                    }
                    this._freeList = newFree;
                    this._freeCount = fc;
                    break;
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
        // FIX 1: Pre-compute and cache voicings once per note instead of per grain
        const pp = data.params;
        let cachedVoicings = null;
        if (pp.chordType && pp.chordType !== 'unison' && !pp._stepPitches) {
            cachedVoicings = _buildVoicings(pp.chordType, pp.chordInversion || 0, pp.chordSpread || 0);
        }
        this.activeNotes.push({
            trackId: Number(data.trackId), 
            startTime: data.time, 
            scanOriginTime: data.scanOriginTime || data.time,
            duration: data.duration,
            params: pp, 
            nextGrainTime: data.time,
            basePosition: pp.position,
            _cachedVoicings: cachedVoicings
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
                        if (this._freeCount > 0) {
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

        // Per-track voice counting
        this._perTrackCount.fill(0);
        for (let i = 0; i < this.activeVoiceIndices.length; i++) {
            const tId = this.voices[this.activeVoiceIndices[i]].trackId;
            if (tId < 32) this._perTrackCount[tId]++;
        }
        
        // Per-track smoothed counts for amplitude scaling
        for (let t = 0; t < 32; t++) {
            this._perTrackSmoothed[t] += (this._perTrackCount[t] - this._perTrackSmoothed[t]) * 0.05;
            // FIX 6: Pre-compute scales — one division per track, not per voice
            const sc = Math.max(1, this._perTrackSmoothed[t]);
            this._perTrackNormalScale[t] = 1.0 / (1.0 + (sc * 0.15));
            this._perTrackCleanScale[t] = 1.0 / sc;
        }

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
            
            // FIX 6: Use pre-computed per-track scales — zero division here
            const trackScale = voice.cleanMode ? this._perTrackCleanScale[tId] : this._perTrackNormalScale[tId];
            
            const vPanL = voice.panL, vPanR = voice.panR;

            // OPT: Pre-compute edgeCrunch outside inner loop
            const hasEdgeCrunch = !voice.cleanMode && voice.edgeCrunch > 0;
            const maxOverflow = hasEdgeCrunch ? 1.0 + (voice.edgeCrunch * voice.edgeCrunch * voice.edgeCrunch * bufLen) : 0;

            // OPT: Pre-multiply constant amplitude factors to reduce per-sample multiplies (4→2)
            const ampBase = baseAmp * trackScale;
            const hasStereo = !!R;

            let ph = voice.phase, amp = voice.releaseAmp, rel = voice.releasing;

            const bufLenM1 = bufLen - 1;

            for (let j = 0; j < frameCount; j++) {
                if (rel) { 
                    amp -= 0.003;
                    if (amp <= 0) { this.killVoice(i); break; } 
                }
                
                if (ph >= gLen) { 
                    if (!rel) rel = true;
                    ph = gLen - 1;
                }
                
                let rPos = start + (ph * pitch);
                
                if (rPos >= bufLen || rPos < 0) {
                    rPos = ((rPos % bufLen) + bufLen) % bufLen;
                }
                
                const idx = rPos | 0;
                let frac = rPos - idx;
                
                if (hasEdgeCrunch) {
                    if (frac < -maxOverflow) frac = -maxOverflow;
                    else if (frac > maxOverflow) frac = maxOverflow;
                }

                const s1 = idx <= bufLenM1 ? buf[idx] : 0;
                const s2 = buf[idx < bufLenM1 ? idx + 1 : 0];
                
                // OPT: 2 multiplies instead of 4 (pre-multiplied ampBase)
                let winIdx = (ph * invGL) | 0;
                if (winIdx > lutMax) winIdx = lutMax;
                const val = (s1 + frac * (s2 - s1)) * wLUT[winIdx] * ampBase * amp;
                
                L[j] += val * vPanL; 
                if (hasStereo) R[j] += val * vPanR;
                if (!rel) ph++;
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
        
        // FIX 4: O(1) voice allocation via free-list stack
        if (this._freeCount <= 0) return;
        const vIdx = this._freeList[--this._freeCount];
        const v = this.voices[vIdx];
        this.activeVoiceIndices.push(vIdx);
        
        // --- STRICT WINDOW WRAPPING LOGIC ---
        let pos = note.basePosition;
        
        // Scan from the correct time origin:
        // - resetOnTrig: scanOriginTime = note.startTime → scans from 0 each trigger
        // - resetOnBar: scanOriginTime = bar start → scans from bar start
        // - normal: scanOriginTime = note.startTime → scans from note start
        const scanSpeed = note.params.scanSpeed;
        if (scanSpeed !== 0) {
            const timeSinceScanOrigin = currentTime - note.scanOriginTime;
            pos += scanSpeed * timeSinceScanOrigin;
        }
        
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
        
        // ═══ Musical Pitch Per Grain (FIX 1 + FIX 2) ═══
        const pp = note.params;
        if (pp.pitchSemi !== undefined) {
            let semi = pp.pitchSemi || 0;
            const fine = pp.pitchFine || 0;
            const scaleType = pp.scaleType || 'chromatic';
            const scaleArr = _SCALES[scaleType];
            const scaleRoot = pp.scaleRoot || 0;
            
            // Scale quantize base pitch
            if (scaleType !== 'chromatic') {
                semi = _quantize(semi, scaleRoot, scaleArr);
            }
            
            // Per-step chord override
            const stepChord = pp._stepPitches;
            let chordSemi = 0;
            
            if (stepChord && stepChord.length > 0) {
                const idx = pp.voiceMode === 'cycle' 
                    ? (this._grainCounter % stepChord.length)
                    : (pp.voiceMode === 'weighted' && this.random() < 0.4) 
                        ? 0 
                        : Math.floor(this.random() * stepChord.length);
                chordSemi = stepChord[idx] || 0;
            } else {
                // FIX 1: Use cached voicings from noteOn instead of rebuilding
                const voicings = note._cachedVoicings;
                if (voicings && voicings.length > 0) {
                    const idx = pp.voiceMode === 'cycle'
                        ? (this._grainCounter % voicings.length)
                        : (pp.voiceMode === 'weighted' && this.random() < 0.4)
                            ? 0
                            : Math.floor(this.random() * voicings.length);
                    chordSemi = voicings[idx] || 0;
                }
            }
            
            // Quantize chord tone to scale
            if (chordSemi !== 0 && scaleType !== 'chromatic') {
                chordSemi = _quantize(chordSemi, 0, scaleArr);
            }
            
            // FIX 2: LUT-based pitch ratio — no Math.pow
            v.pitch = _pitchRatio(semi + chordSemi, fine);
            this._grainCounter++;
        } else {
            v.pitch = pp.pitch || 1;
        }
        v.velocity = note.params.velocity || 1;
        v.releasing = false; 
        v.releaseAmp = 1.0;
        v.cleanMode = !!note.params.cleanMode;
        v.edgeCrunch = note.params.edgeCrunch || 0;
        v.orbit = note.params.orbit || 0;
        
        // FIX 3: LUT-based stereo pan — no Math.cos/Math.sin
        const spread = note.params.stereoSpread || 0;
        if (spread > 0) {
            const panPos = (this.random() * 2 - 1) * spread;
            const panIdx = _panLookup(panPos);
            v.panL = _PAN_L[panIdx];
            v.panR = _PAN_R[panIdx];
        } else {
            v.panL = 0.7071;
            v.panR = 0.7071;
        }
    }
    
    killVoice(idx) {
        const vIdx = this.activeVoiceIndices[idx];
        this.voices[vIdx].active = false;
        // FIX 4: Return to free-list
        this._freeList[this._freeCount++] = vIdx;
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