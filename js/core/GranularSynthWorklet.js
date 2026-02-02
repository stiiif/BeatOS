// Granular SynthWorklet - Main Thread Bridge
// Updated for Phase 2: Supports loading updated processor file

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
        
        console.log('[GranularSynthWorklet] Created (not yet initialized)');
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        console.log('[GranularSynthWorklet] Starting initialization...');
        
        this.initPromise = (async () => {
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) {
                throw new Error('AudioContext not available');
            }
            
            try {
                // Try loading the file first
                try {
                    console.log('[GranularSynthWorklet] Attempting to load processor file...');
                    await audioCtx.audioWorklet.addModule('js/worklets/granular-processor.js');
                    console.log('[GranularSynthWorklet] ✅ Loaded from file');
                } catch (e) {
                    console.warn('[GranularSynthWorklet] File load failed, falling back to inline blob:', e);
                    // Fallback to inline Blob
                    const workletCode = this.getWorkletCode();
                    const blob = new Blob([workletCode], { type: 'application/javascript' });
                    const blobURL = URL.createObjectURL(blob);
                    
                    try {
                        await audioCtx.audioWorklet.addModule(blobURL);
                        console.log('[GranularSynthWorklet] ✅ Loaded from Blob URL');
                    } finally {
                        URL.revokeObjectURL(blobURL);
                    }
                }
                
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts
                });
                
                this.workletNode.port.onmessage = (e) => {
                    this.handleWorkletMessage(e.data);
                };
                
                this.workletNode.connectedTracks = new Set();
                
                this.isInitialized = true;
                console.log('[GranularSynthWorklet] ✅ Initialized successfully!');
            } catch (error) {
                console.error('[GranularSynthWorklet] ❌ Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }
    
    handleWorkletMessage(message) {
        const { type, data, trackId } = message;
        
        switch(type) {
            case 'bufferLoaded':
                console.log(`[GranularSynthWorklet] Buffer loaded for track ${trackId}`);
                const resolve = this.pendingLoads.get(trackId);
                if (resolve) {
                    resolve();
                    this.pendingLoads.delete(trackId);
                }
                break;
                
            case 'stats':
                if (data && data.activeVoices !== undefined) {
                    this.activeGrains = data.activeVoices;
                }
                break;
            
            // Allow other components to handle 'tick' via setupWorkletListener
        }
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = Math.min(64, max);
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        
        const trackId = track.id;
        const cachedBuffer = this.trackBufferCache.get(track);
        
        if (cachedBuffer && cachedBuffer === track.buffer) return;
        if (!track.buffer) return;
        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        console.log(`[GranularSynthWorklet] Uploading new buffer for Track ${trackId}...`);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            const channelData = track.buffer.getChannelData(0);
            const bufferCopy = new Float32Array(channelData);
            const rmsMap = track.rmsMap || [];
            
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: {
                    trackId,
                    buffer: bufferCopy,
                    rmsMap: rmsMap
                }
            }, [bufferCopy.buffer]); 
            
            setTimeout(() => {
                if (this.pendingLoads.has(trackId)) {
                    console.warn('[GranularSynthWorklet] Buffer load timeout for track:', trackId);
                    resolve();
                    this.pendingLoads.delete(trackId);
                }
            }, 1000);
        });
        
        await loadPromise;
        this.trackBufferCache.set(track, track.buffer);
    }

    // Legacy method for manual triggering (optional now)
    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        if (!this.isInitialized) await this.init();
        // ... Logic is now in Worklet, this is just a wrapper for 'noteOn' if needed ...
        // Keeping it minimal as Scheduler.js uses syncSequencer mostly
    }
    
    stopAll() {
        if (!this.isInitialized || !this.workletNode) return;
        this.workletNode.port.postMessage({ type: 'stopAll' });
        this.activeGrains = 0;
    }
    
    getStats() {
        if (!this.isInitialized || !this.workletNode) return null;
        this.workletNode.port.postMessage({ type: 'getStats' });
    }
    
    disconnect() {
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        this.isInitialized = false;
        this.trackBufferCache = new WeakMap();
        this.pendingLoads.clear();
    }
    
    // Updated fallback code to match new processor logic
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
        this.sequencer = { playing: false, currentStep: 0, samplesPerStep: 0, sampleCounter: 0, steps: [], bpm: 120, trackParams: new Map() };
        this.drumVoices = [];
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            const phase = i / 4095;
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'syncSequencer': this.syncSequencer(data); break;
                case 'transport': this.handleTransport(data); break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; this.drumVoices = []; this.sequencer.playing = false; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'getStats': this.sendStats(); break;
            }
        };
    }
    syncSequencer(data) {
        if (data.bpm) this.sequencer.bpm = data.bpm;
        if (data.steps) this.sequencer.steps = data.steps;
        if (data.trackParams) {
            data.trackParams.forEach(t => this.sequencer.trackParams.set(t.id, t));
        }
        this.calculateTiming();
    }
    handleTransport(data) {
        if (data.action === 'start') {
            this.sequencer.playing = true; this.sequencer.currentStep = 0; this.sequencer.sampleCounter = 0; this.calculateTiming();
        } else if (data.action === 'stop') {
            this.sequencer.playing = false; this.stopAllVoices(); this.drumVoices = [];
        }
    }
    calculateTiming() {
        const stepsPerSecond = (this.sequencer.bpm / 60) * 4;
        this.sequencer.samplesPerStep = sampleRate / stepsPerSecond;
    }
    cubicHermite(y0, y1, y2, y3, x) {
        const c0 = y1; const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
        return ((c3 * x + c2) * x + c1) * x + c0;
    }
    handleNoteOn(data) {
        const { trackId, time, duration, params } = data;
        const trackInfo = this.sequencer.trackParams.get(trackId);
        if (trackInfo && trackInfo.type === 'simple-drum') this.triggerDrumSynth(trackId, params);
        else this.activeNotes.push({ trackId, startTime: time, duration, params, nextGrainTime: currentTime });
    }
    triggerDrumSynth(trackId, params) {
        const trackInfo = this.sequencer.trackParams.get(trackId);
        const voice = { active: true, trackId, type: trackInfo?.params?.drumType || 'kick', phase: 0, params: { tune: trackInfo?.params?.drumTune||0.5, decay: trackInfo?.params?.drumDecay||0.5, gain: params.velocity||1.0 } };
        this.drumVoices.push(voice);
    }
    generateKick(v) {
        const t = v.phase / sampleRate;
        const freq = (150+(v.params.tune*200)) * Math.exp(-t/(0.01+(v.params.decay*0.1))) + (50+(v.params.tune*100));
        const amp = Math.exp(-t/(0.1+(v.params.decay*0.5)));
        if(amp<0.001) v.active=false;
        return Math.sin(v.phase*2*Math.PI*freq/sampleRate) * amp * v.params.gain;
    }
    generateSnare(v) {
        const t = v.phase / sampleRate;
        const tone = Math.sin(v.phase*2*Math.PI*(180+(v.params.tune*100))/sampleRate) * Math.exp(-t/(0.1+(v.params.decay*0.1)));
        const noise = (Math.random()*2-1) * Math.exp(-t/(0.05+(v.params.decay*0.3)));
        if(Math.exp(-t/(0.1+(v.params.decay*0.1))) < 0.001) v.active=false;
        return ((tone*0.5)+(noise*0.5)) * v.params.gain;
    }
    generateHat(v) {
        const t = v.phase / sampleRate;
        const amp = Math.exp(-t/(0.05+(v.params.decay*0.2)));
        if(amp<0.001) v.active=false;
        return (Math.random()*2-1) * amp * v.params.gain;
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || output.length === 0) return true;
        const frameCount = output[0].length;
        
        if (this.sequencer.playing) {
            for (let i = 0; i < frameCount; i++) {
                this.sequencer.sampleCounter++;
                if (this.sequencer.sampleCounter >= this.sequencer.samplesPerStep) {
                    this.sequencer.sampleCounter = 0;
                    const stepIdx = this.sequencer.currentStep;
                    if (this.sequencer.steps) {
                        this.sequencer.steps.forEach((trackSteps, trackId) => {
                            if (!trackSteps) return;
                            const vel = trackSteps[stepIdx];
                            if (vel > 0) {
                                const info = this.sequencer.trackParams.get(trackId);
                                if (info) {
                                    let g = 0.75; if(vel===1)g=0.4; if(vel===3)g=1.0;
                                    if (info.type === 'simple-drum') this.triggerDrumSynth(trackId, {velocity:g});
                                    else this.activeNotes.push({ trackId, startTime: currentTime, duration: info.params.relGrain||0.5, params: {...info.params, velocity:g}, nextGrainTime: currentTime });
                                }
                            }
                        });
                    }
                    this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 32;
                    this.port.postMessage({ type: 'tick', step: stepIdx });
                }
            }
        }
        
        for (let j=0; j<outputs.length; j++) if(outputs[j]) for(let ch=0; ch<outputs[j].length; ch++) outputs[j][ch].fill(0);

        // Granular logic
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (currentTime > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (currentTime >= note.startTime) {
                let interval = 1 / Math.max(1, note.params.density || 20);
                if (note.params.overlap > 0) interval = (note.params.grainSize||0.1) / Math.max(0.1, note.params.overlap);
                let spawned = 0;
                while (note.nextGrainTime < currentTime + (frameCount/sampleRate) && spawned < 10) {
                    if (note.nextGrainTime >= currentTime) {
                        const trkData = this.trackBuffers.get(note.trackId);
                        if(trkData && trkData.buffer) {
                            let v = this.voices.find(vo => !vo.active);
                            if(!v) { v = this.voices.reduce((o,vn)=>vn.startFrame<o.startFrame?vn:o); v.releasing=true; }
                            v.active=true; v.trackId=note.trackId; v.buffer=trkData.buffer; v.bufferLength=trkData.buffer.length;
                            v.position=note.params.position; v.phase=0; 
                            v.grainLength=Math.max(128, Math.floor((note.params.grainSize||0.1)*sampleRate));
                            v.pitch=Math.max(0.05, note.params.pitch||1.0); v.velocity=note.params.velocity||1.0;
                            v.startFrame=this.currentFrame; v.releasing=false; v.releaseAmp=1.0;
                            this.totalGrainsTriggered++;
                        }
                    }
                    note.nextGrainTime += interval; spawned++;
                }
            }
        }

        // Voice Processing
        for (let v of this.voices) {
            if (!v.active || !v.buffer) continue;
            const out = outputs[v.trackId];
            if (!out) continue;
            for (let i = 0; i < frameCount; i++) {
                if (v.releasing) { v.releaseAmp -= 0.015; if(v.releaseAmp<=0) { v.active=false; break; } }
                if (v.phase >= v.grainLength) { v.active=false; break; }
                const idx = (v.position * v.bufferLength) + (v.phase * v.pitch);
                const samp = v.buffer[Math.floor(idx % v.bufferLength)] || 0; 
                const env = this.windowLUT[Math.floor((v.phase/v.grainLength)*4095)] || 0;
                const s = samp * env * v.velocity * v.releaseAmp;
                out[0][i] += s; if(out.length>1) out[1][i] += s;
                v.phase++;
            }
        }

        // Drum Processing
        for (let i=this.drumVoices.length-1; i>=0; i--) {
            const v = this.drumVoices[i];
            if (!v.active) { this.drumVoices.splice(i, 1); continue; }
            const out = outputs[v.trackId];
            if (!out) continue;
            for (let f=0; f<frameCount; f++) {
                let s = 0;
                if(v.type==='kick') s=this.generateKick(v);
                else if(v.type==='snare') s=this.generateSnare(v);
                else s=this.generateHat(v);
                out[0][f]+=s; if(out.length>1) out[1][f]+=s;
                v.phase++;
            }
        }
        
        this.currentFrame += frameCount;
        return true;
    }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}