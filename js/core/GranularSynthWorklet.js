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
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) throw new Error('AudioContext not available');
            
            try {
                // 1. Fetch the compiled Wasm
                console.log("[GranularSynth] Fetching WASM...");
                const wasmResponse = await fetch('granular.wasm');
                if (!wasmResponse.ok) throw new Error("Could not find granular.wasm");
                const wasmBytes = await wasmResponse.arrayBuffer();

                // 2. Load the Hybrid Processor
                await audioCtx.audioWorklet.addModule('js/worklets/granular-processor.js');
                
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts,
                    // Pass Wasm bytes via options (optional, or use message)
                    processorOptions: { wasmBytes: wasmBytes }
                });
                
                // Redundant check: Send bytes again just in case constructor missed it
                this.workletNode.port.postMessage({ type: 'initWasm', data: { bytes: wasmBytes } });

                this.workletNode.port.onmessage = (event) => {
                    if (event.data.type === 'grainCount') {
                        this.activeGrains = event.data.count;
                    }
                };

                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
                console.log('[GranularSynth] ✅ Hybrid Engine Ready');
            } catch (error) {
                console.error('[GranularSynth] Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    // --- TEST HELPER ---
    // Mode 0: JS Only (Legacy)
    // Mode 1: WASM Only (Production)
    // Mode 2: Null Test (Silence = Success)
    setEngineMode(mode) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'setMode', data: { mode } });
        }
    }

    // ... (Rest of existing methods: ensureBufferLoaded, scheduleNote, etc. remain unchanged) ...
    
    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = track.id;
        if (!track.buffer) return;
        const lastKnownBuffer = this.bufferVersionMap.get(trackId);
        if (lastKnownBuffer === track.buffer) return; 

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

        // --- HANDLE SCAN RESET LOGIC ---
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
    
    getActiveGrainCount() { return this.activeGrains; }
    
    setMaxGrains(max) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'setMaxGrains', data: { max } });
        }
    }
}