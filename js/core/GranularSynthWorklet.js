// Granular SynthWorklet - Full DSP loop with integrated Heat/Saturation Engine
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
                
                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
                console.log('[GranularSynthWorklet] ✅ Full Engine with Heat Stages Ready');
            } catch (error) {
                console.error('[GranularSynthWorklet] Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    updateTrackParam(trackId, param, value) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({
                type: 'updateParam',
                data: { trackId, param, value }
            });
        }
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = track.id;
        const cachedBuffer = this.trackBufferCache.get(track);
        if (cachedBuffer && cachedBuffer === track.buffer) return;
        if (!track.buffer) return;
        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            const channelData = track.buffer.getChannelData(0);
            
            // DIAGNOSTIC: Zero-Tolerance Peak Scan to prevent runaway amplitudes
            let maxAmp = 0;
            for(let i=0; i<channelData.length; i++) {
                const a = Math.abs(channelData[i]);
                if(a > maxAmp) maxAmp = a;
            }

            const bufferCopy = new Float32Array(channelData);
            
            // If sample data is corrupt/nuclear, normalize it immediately
            if(maxAmp > 1.1) {
                console.warn(`[Worklet-Loader] Track ${trackId} normalization active (Peak: ${maxAmp.toFixed(2)})`);
                for(let i=0; i<bufferCopy.length; i++) bufferCopy[i] /= (maxAmp + 0.001);
            }

            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: { trackId, buffer: bufferCopy }
            }, [bufferCopy.buffer]);
            resolve();
            this.pendingLoads.delete(trackId);
        });
        await loadPromise;
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
            if (lfo.target === 'filter') mod.filter += v * 5000; 
            if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000; 
            if (lfo.target === 'volume') mod.volume += v * 0.5;
            if (lfo.target === 'pan') mod.pan += v;
        });

        if (track.bus.hp) track.bus.hp.frequency.setTargetAtTime(this.audioEngine.getMappedFrequency(Math.max(20, p.hpFilter + mod.hpFilter), 'hp'), now, 0.05);
        if (track.bus.lp) track.bus.lp.frequency.setTargetAtTime(this.audioEngine.getMappedFrequency(Math.max(100, p.filter + mod.filter), 'lp'), now, 0.05);
        if (track.bus.vol) track.bus.vol.gain.setTargetAtTime(Math.max(0, p.volume + mod.volume), now, 0.05);
        if (track.bus.pan) track.bus.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p.pan + mod.pan)), now, 0.05);
    }

    async scheduleNote(track, time, visualCb, velocityLevel = 2, stepIndex = 0) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            visualCb(time, track.id);
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

        let gainMult = velocityLevel === 1 ? 0.3 : (velocityLevel === 3 ? 1.0 : 0.7);

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: track.id,
                time: time,
                duration: track.params.relGrain,
                stepIndex: stepIndex,
                params: {
                    ...track.params,
                    velocity: gainMult,
                    cleanMode: track.cleanMode,
                    heatDrive: track.heatDrive,
                    heatCeiling: track.heatCeiling
                }
            }
        });

        visualCb(time, track.id);
    }
    
    getWorkletCode() {
        return `
class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0, velocity: 1.0,
            trackId: 0, invGrainLength: 0
        }));
        this.activeVoiceIndices = [];
        this.activeNotes = [];
        this.trackBuffers = new Map();
        this.trackPlayheads = new Float32Array(32); 
        this.trackCleanModes = new Uint8Array(32);
        this.trackHeatDrive = new Float32Array(32).fill(1.0);
        this.trackHeatCeiling = new Float32Array(32).fill(1.0);

        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i/4095));

        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'noteOn') this.handleNoteOn(data);
            if (type === 'setBuffer') this.trackBuffers.set(data.trackId, data.buffer);
            if (type === 'updateParam') {
                if (data.param === 'cleanMode') this.trackCleanModes[data.trackId] = data.value ? 1 : 0;
                if (data.param === 'heatDrive') this.trackHeatDrive[data.trackId] = data.value;
                if (data.param === 'heatCeiling') this.trackHeatCeiling[data.trackId] = data.value;
            }
        };
    }

    handleNoteOn(data) {
        const tId = data.trackId;
        const p = data.params;
        this.trackCleanModes[tId] = p.cleanMode ? 1 : 0;
        this.trackHeatDrive[tId] = p.heatDrive;
        this.trackHeatCeiling[tId] = p.heatCeiling;

        if (p.resetOnTrig) this.trackPlayheads[tId] = p.position;
        else if (p.resetOnBar && data.stepIndex === 0) this.trackPlayheads[tId] = p.position;

        this.activeNotes.push({ trackId: tId, startTime: data.time, duration: data.duration, params: p, nextGrainTime: data.time });
    }

    process(inputs, outputs) {
        const frameCount = outputs[0][0].length;
        const now = currentTime;
        for (let o = 0; o < outputs.length; o++) { outputs[o][0].fill(0); outputs[o][1].fill(0); }

        // 1. Scheduler
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let interval = note.params.grainSize / Math.max(0.1, note.params.overlap || 1);
                while (note.nextGrainTime < now + (frameCount / sampleRate)) {
                    this.spawnGrain(note);
                    note.nextGrainTime += interval;
                }
            }
        }

        if (this.activeVoiceIndices.length === 0) { this.updatePlayheads(frameCount); return true; }

        // 2. DSP Loop
        for (let i = this.activeVoiceIndices.length - 1; i >= 0; i--) {
            const vIdx = this.activeVoiceIndices[i];
            const voice = this.voices[vIdx];
            const trackOut = outputs[voice.trackId];
            const isClean = this.trackCleanModes[voice.trackId] === 1;

            const trackScale = isClean 
                ? (1.0 / Math.max(1, this.activeVoiceIndices.length)) 
                : (1.0 / (1.0 + (this.activeVoiceIndices.length * 0.15)));

            let ph = voice.phase;
            for (let j = 0; j < frameCount; j++) {
                if (ph >= voice.grainLength) { this.killVoice(i); break; }
                const rPos = (voice.position * voice.bufferLength) + (ph * voice.pitch);
                let idx = (rPos | 0) % voice.bufferLength;
                if (idx < 0) idx += voice.bufferLength;
                const sample = voice.buffer[idx] || 0;
                const win = this.windowLUT[(ph * voice.invGrainLength) | 0] || 0;
                const val = sample * win * voice.velocity * trackScale;
                trackOut[0][j] += val; trackOut[1][j] += val;
                ph++;
            }
            voice.phase = ph;
        }

        // 3. FINAL HEAT STAGE (Saturation & Safe Limiting)
        for (let o = 0; o < outputs.length; o++) {
            const isClean = this.trackCleanModes[o] === 1;
            const drive = this.trackHeatDrive[o];
            const ceil = this.trackHeatCeiling[o];

            for (let j = 0; j < frameCount; j++) {
                let sL = outputs[o][0][j] * drive;
                let sR = outputs[o][1][j] * drive;

                if (isClean) {
                    outputs[o][0][j] = Math.max(-ceil, Math.min(ceil, sL));
                    outputs[o][1][j] = Math.max(-ceil, Math.min(ceil, sR));
                } else {
                    // Soft-Saturator with Dynamic Ceiling
                    outputs[o][0][j] = (sL / (ceil + Math.abs(sL))) * ceil;
                    outputs[o][1][j] = (sR / (ceil + Math.abs(sR))) * ceil;
                }
            }
        }

        this.updatePlayheads(frameCount);
        return true;
    }

    updatePlayheads(frameCount) {
        for (let tId = 0; tId < 32; tId++) {
            let speed = 0;
            for (let n of this.activeNotes) if (n.trackId === tId) speed = n.params.scanSpeed;
            this.trackPlayheads[tId] = (this.trackPlayheads[tId] + (speed * (frameCount / sampleRate))) % 1.0;
        }
    }

    spawnGrain(note) {
        let v = null;
        for(let i=0; i<64; i++) if(!this.voices[i].active) { v = this.voices[i]; this.activeVoiceIndices.push(i); break; }
        if(!v) return;
        v.active = true; v.trackId = note.trackId; v.buffer = this.trackBuffers.get(note.trackId); 
        v.bufferLength = v.buffer.length; v.position = this.trackPlayheads[note.trackId]; v.phase = 0;
        v.grainLength = Math.max(128, Math.floor(note.params.grainSize * sampleRate));
        v.invGrainLength = 4095 / v.grainLength; v.pitch = note.params.pitch; v.velocity = note.params.velocity;
    }
    killVoice(idx) { this.voices[this.activeVoiceIndices[idx]].active = false; this.activeVoiceIndices.splice(idx, 1); }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}