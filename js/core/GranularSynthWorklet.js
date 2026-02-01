// Granular SynthWorklet Bridge
// Phase 4: AudioWorklet Sequencer Control (FULL VERSION - FIXED)

import { VELOCITY_GAINS, MAX_TRACKS } from '../utils/constants.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        this.MAX_GRAINS = 64; 
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
                
                try {
                    await audioCtx.audioWorklet.addModule(blobURL);
                } finally {
                    URL.revokeObjectURL(blobURL);
                }
                
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts
                });
                
                this.workletNode.port.onmessage = (e) => { this.handleWorkletMessage(e.data); };
                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
            } catch (error) {
                console.error('[GranularSynthWorklet] Init failed:', error);
                throw error;
            }
        })();
        return this.initPromise;
    }
    
    handleWorkletMessage(message) {
        const { type, data, trackId, step, velocity, time } = message;
        switch(type) {
            case 'bufferLoaded':
                const resolve = this.pendingLoads.get(trackId);
                if (resolve) { resolve(); this.pendingLoads.delete(trackId); }
                break;
            case 'stats':
                if (data && data.activeVoices !== undefined) {
                    this.activeGrains = data.activeVoices;
                }
                break;
            case 'step':
                window.dispatchEvent(new CustomEvent('sequencer:step', { detail: { step } }));
                break;
            case 'triggerExternal':
                window.dispatchEvent(new CustomEvent('sequencer:trigger', { detail: { trackId, velocity, time } }));
                break;
        }
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = Math.min(64, max); 
    }

    startTransport() { if (this.workletNode) this.workletNode.port.postMessage({ type: 'transport:start' }); }
    stopTransport() { if (this.workletNode) this.workletNode.port.postMessage({ type: 'transport:stop' }); }
    setBPM(bpm) { if (this.workletNode) this.workletNode.port.postMessage({ type: 'setBPM', data: bpm }); }

    updateTrackPattern(trackId, steps, microtiming) {
        if (!this.workletNode) return;
        this.workletNode.port.postMessage({
            type: 'updatePattern',
            data: { trackId, steps, microtiming }
        });
    }

    updateTrackParams(trackId, params) {
        if (!this.workletNode) return;
        this.workletNode.port.postMessage({
            type: 'updateParams',
            data: { trackId, params }
        });
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
            const bufferCopy = new Float32Array(channelData);
            const rmsMap = track.rmsMap || [];
            this.workletNode.port.postMessage({
                type: 'setBuffer', data: { trackId, buffer: bufferCopy, rmsMap }
            }, [bufferCopy.buffer]);
            setTimeout(() => { if (this.pendingLoads.has(trackId)) { resolve(); this.pendingLoads.delete(trackId); } }, 1000);
        });
        await loadPromise;
        this.trackBufferCache.set(track, track.buffer);
    }

    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            return;
        }
        if (!this.isInitialized) await this.init();
        if (!track.buffer || !track.bus) return;
        await this.ensureBufferLoaded(track);

        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        const p = track.params;
        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: track.id, time: time, duration: p.relGrain || 0.4,
                params: { ...p, velocity: velocityLevel === 1 ? 0.4 : (velocityLevel === 3 ? 1.0 : 0.75) }
            }
        });
        if (scheduleVisualDrawCallback) scheduleVisualDrawCallback(time, track.id);
    }
    
    stopAll() { if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' }); }
    getStats() { if (this.workletNode) this.workletNode.port.postMessage({ type: 'getStats' }); }
    
    getWorkletCode() {
        return `
class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0,
            velocity: 1.0, startFrame: 0, trackId: null,
            releasing: false, releaseAmp: 1.0
        }));
        this.activeNotes = [];
        this.sequencer = { playing: false, bpm: 120, currentStep: -1, samplesPerStep: 0, accumulatedSamples: 0 };
        this.tracksData = new Map();
        this.pendingTriggers = [];
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) { this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i/4095)); }
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'transport:start': this.sequencer.playing = true; this.sequencer.currentStep = -1; this.sequencer.accumulatedSamples = this.sequencer.samplesPerStep; break;
                case 'transport:stop': this.sequencer.playing = false; this.activeNotes = []; this.stopAllVoices(); break;
                case 'setBPM': this.sequencer.bpm = data; this.updateTimingConstants(); break;
                case 'updatePattern': { const cur = this.tracksData.get(data.trackId) || {}; this.tracksData.set(data.trackId, { ...cur, steps: data.steps, microtiming: data.microtiming }); break; }
                case 'updateParams': { const cur = this.tracksData.get(data.trackId) || {}; this.tracksData.set(data.trackId, { ...cur, params: data.params }); break; }
                case 'trigger': this.triggerGrain(data); break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'updateBuffer': this.updateBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'getStats': this.sendStats(); break;
            }
        };
        this.updateTimingConstants();
    }
    updateTimingConstants() { this.sequencer.samplesPerStep = ((60 / (this.sequencer.bpm || 120)) / 4) * sampleRate; }
    cubicHermite(y0, y1, y2, y3, x) {
        const c0=y1, c1=0.5*(y2-y0), c2=y0-2.5*y1+2.0*y2-0.5*y3, c3=0.5*(y3-y0)+1.5*(y1-y2);
        return ((c3*x+c2)*x+c1)*x+c0;
    }
    handleNoteOn(data) { this.activeNotes.push({ trackId: data.trackId, startTime: data.time, duration: data.duration, params: data.params, nextGrainTime: data.time }); }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const frameCount = output[0].length;
        const now = currentTime;
        
        if (this.sequencer.playing) {
            let samplesToProcess = frameCount;
            let blockOffset = 0;
            while (this.sequencer.accumulatedSamples + samplesToProcess >= this.sequencer.samplesPerStep) {
                const frames = Math.floor(this.sequencer.samplesPerStep - this.sequencer.accumulatedSamples);
                this.sequencer.accumulatedSamples += frames; samplesToProcess -= frames; blockOffset += frames;
                this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 64;
                this.sequencer.accumulatedSamples = 0;
                this.port.postMessage({ type: 'step', step: this.sequencer.currentStep });
                this.scheduleTracksForStep(this.sequencer.currentStep, this.currentFrame + blockOffset);
            }
            this.sequencer.accumulatedSamples += samplesToProcess;
        }

        for (let i = this.pendingTriggers.length - 1; i >= 0; i--) {
            const t = this.pendingTriggers[i];
            if (t.triggerTime < this.currentFrame + frameCount) {
                this.port.postMessage({ type: 'triggerExternal', trackId: t.trackId, velocity: t.velocity, time: currentTime });
                const info = this.tracksData.get(t.trackId);
                const p = info && info.params ? info.params : {};
                this.handleNoteOn({
                    trackId: t.trackId, time: t.triggerTime / sampleRate, duration: p.relGrain || 0.4,
                    params: { ...p, velocity: t.velocity, density: p.density||20, grainSize: p.grainSize||0.1 }
                });
                this.pendingTriggers.splice(i, 1);
            }
        }

        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let interval = 1 / Math.max(1, note.params.density || 20);
                if (note.params.overlap > 0) interval = (note.params.grainSize || 0.1) / Math.max(0.1, note.params.overlap);
                const end = now + (frameCount / sampleRate);
                let count = 0;
                while (note.nextGrainTime < end && count < 10) {
                    if (note.nextGrainTime >= now) this.spawnGrainFromNote(note);
                    note.nextGrainTime += interval; count++;
                }
            }
        }

        if (output.length === 0) return true;
        for (let ch = 0; ch < output.length; ch++) output[ch].fill(0);

        for (let v of this.voices) {
            if (!v.active || !v.buffer) continue;
            const out = outputs[v.trackId];
            if (!out) continue;
            for (let i = 0; i < frameCount; i++) {
                if (v.releasing) { v.releaseAmp -= (1.0/64.0); if (v.releaseAmp <= 0) { v.active = false; v.releasing = false; break; } }
                if (v.phase >= v.grainLength) { v.active = false; break; }
                const pos = (v.position * v.bufferLength + v.phase * v.pitch) % v.bufferLength;
                const idx = Math.floor(pos); const frac = pos - idx;
                const s = this.cubicHermite(v.buffer[(idx-1+v.bufferLength)%v.bufferLength]||0, v.buffer[idx]||0, v.buffer[(idx+1)%v.bufferLength]||0, v.buffer[(idx+2)%v.bufferLength]||0, frac);
                const env = this.windowLUT[Math.floor((v.phase/v.grainLength)*4095)] || 0;
                const val = s * env * v.velocity * v.releaseAmp;
                out[0][i] += val; if (out.length > 1) out[1][i] += val;
                v.phase++;
            }
        }
        
        const gain = 0.5;
        for (let out of outputs) {
            if (!out) continue;
            for (let ch of out) { for (let i=0; i<frameCount; i++) { const s = ch[i]*gain; const x = Math.max(-3, Math.min(3, s)); ch[i] = x*(27+x*x)/(27+9*x*x); } }
        }
        this.currentFrame += frameCount;
        return true;
    }
    
    scheduleTracksForStep(step, frame) {
        this.tracksData.forEach((d, id) => {
            if (d.steps && d.steps[step] > 0) this.pendingTriggers.push({ triggerTime: frame + Math.floor(((d.microtiming ? d.microtiming[step] : 0)/1000)*sampleRate), trackId: id, velocity: d.steps[step] });
        });
    }
    
    spawnGrainFromNote(note) {
        const d = this.trackBuffers.get(note.trackId);
        if (!d || !d.buffer) return;
        let v = this.voices.find(v => !v.active);
        if (!v) { v = this.voices.reduce((a, b) => a.startFrame < b.startFrame ? a : b); v.releasing = true; }
        v.active = true; v.trackId = note.trackId; v.buffer = d.buffer; v.bufferLength = d.buffer.length;
        let pos = note.params.position;
        if (note.params.spray) pos = Math.max(0, Math.min(1, pos + (Math.random()*2-1)*note.params.spray));
        v.position = pos; v.phase = 0; v.grainLength = Math.max(128, Math.floor((note.params.grainSize||0.1)*sampleRate));
        v.pitch = Math.max(0.05, Math.min(8.0, note.params.pitch||1.0));
        let vel = 0.75; if (note.params.velocity === 1) vel = 0.4; if (note.params.velocity === 3) vel = 1.0;
        v.velocity = vel; v.startFrame = this.currentFrame; v.releasing = false; v.releaseAmp = 1.0;
    }
    triggerGrain(d) { this.handleNoteOn({ trackId: d.trackId, time: currentTime, duration: d.grainSize, params: { ...d, density: 1, overlap: 0 } }); }
    setBuffer(id, b, m) { this.trackBuffers.set(id, { buffer: b, rmsMap: m ? m.map(v=>v>0.01) : null }); this.port.postMessage({ type: 'bufferLoaded', trackId: id, bufferLength: b.length }); }
    updateBuffer(id, b, m) { this.setBuffer(id, b, m); }
    stopAllVoices() { for(let v of this.voices) if(v.active) { v.releasing = true; v.releaseAmp = 1.0; } }
    stopTrack(id) { this.activeNotes = this.activeNotes.filter(n => n.trackId !== id); for(let v of this.voices) if(v.trackId === id && v.active) { v.releasing = true; v.releaseAmp = 1.0; } }
    sendStats() { this.port.postMessage({ type: 'stats', data: { activeVoices: this.voices.filter(v => v.active).length } }); }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}