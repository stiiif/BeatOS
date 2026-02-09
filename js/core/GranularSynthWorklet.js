// js/core/GranularSynthWorklet.js
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
        this.lastBarStartTimes = new Map();
        
        // Cache last known filter targets to avoid redundant updates
        this.lastFilterTargets = new Map();
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) throw new Error('AudioContext not available');
            
            try {
                // 1. Fetch the WASM Binary
                const wasmResponse = await fetch('granular.wasm');
                if (!wasmResponse.ok) throw new Error(`Failed to load granular.wasm: ${wasmResponse.status} ${wasmResponse.statusText}`);
                const wasmBytes = await wasmResponse.arrayBuffer();

                // 2. Load the JS Processor wrapper
                // Use a Blob to ensure we are loading exactly what we expect and catch syntax errors early
                const procUrl = 'js/worklets/granular-processor-wasm.js';
                const procResponse = await fetch(procUrl);
                if (!procResponse.ok) throw new Error(`Failed to load ${procUrl}: ${procResponse.status}`);
                const procText = await procResponse.text();

                if (procText.trim().startsWith('<') || !procText.includes('registerProcessor')) {
                    throw new Error(`Invalid processor script at ${procUrl}. Content appears to be HTML or missing registerProcessor call.`);
                }

                // Create a Blob URL for the processor
                const procBlob = new Blob([procText], { type: 'application/javascript' });
                const procBlobUrl = URL.createObjectURL(procBlob);

                try {
                    await audioCtx.audioWorklet.addModule(procBlobUrl);
                } catch (moduleError) {
                    throw new Error(`Failed to add AudioWorklet module: ${moduleError.message}`);
                } finally {
                    URL.revokeObjectURL(procBlobUrl);
                }

                // 3. Create the Node, passing WASM bytes in options
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                try {
                    this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-wasm', {
                        numberOfInputs: 0,
                        numberOfOutputs: MAX_TRACKS,
                        outputChannelCount: outputChannelCounts,
                        processorOptions: {
                            wasmBytes: wasmBytes,
                            maxTracks: MAX_TRACKS
                        }
                    });
                } catch (nodeError) {
                    throw new Error(`Failed to construct AudioWorkletNode 'beatos-granular-wasm'. This usually means the processor script failed to register the name. Error: ${nodeError.message}`);
                }
                
                // 4. Handle messages
                this.workletNode.port.onmessage = (event) => {
                    if (event.data.type === 'grainCount') {
                        this.activeGrains = event.data.count;
                    }
                };

                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
                console.log('[GranularSynthWorklet] ✅ WASM Engine Ready');
            } catch (error) {
                console.error('[GranularSynthWorklet] Initialization failed:', error);
                this.initPromise = null; // Reset promise so we can retry
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    // --- BUFFER MANAGEMENT ---
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
            
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: { 
                    trackId: Number(trackId), 
                    buffer: channelData 
                }
            }); 
            
            resolve();
            this.pendingLoads.delete(trackId);
        });

        await loadPromise;
        this.bufferVersionMap.set(trackId, track.buffer);
    }

    // --- BUS CONNECTION ---
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

        // Initialize cache for this track if missing
        if (!this.lastFilterTargets.has(track.id)) {
            this.lastFilterTargets.set(track.id, { hp: -1, lp: -1 });
        }
        const lastTargets = this.lastFilterTargets.get(track.id);

        // --- FILTER SAFETY LOGIC ---
        
        if (track.bus.hp) {
            let targetHp = Math.max(20, p.hpFilter + mod.hpFilter);
            targetHp = Math.min(20000, targetHp);
            const freq = this.audioEngine.getMappedFrequency(targetHp, 'hp');
            
            if (Math.abs(freq - lastTargets.hp) > 1.0) {
                track.bus.hp.frequency.setTargetAtTime(freq, now, 0.05);
                lastTargets.hp = freq;
            }
        }
        
        if (track.bus.lp) {
            let targetLp = Math.max(100, p.filter + mod.filter);
            targetLp = Math.min(20000, targetLp); 
            const freq = this.audioEngine.getMappedFrequency(targetLp, 'lp');
            
            if (Math.abs(freq - lastTargets.lp) > 1.0) {
                track.bus.lp.frequency.setTargetAtTime(freq, now, 0.05);
                lastTargets.lp = freq;
            }
        }

        if (track.bus.vol) {
            let gain = Math.max(0, p.volume + mod.volume);
            track.bus.vol.gain.setTargetAtTime(gain, now, 0.02);
        }
        
        if (track.bus.pan) {
            let panVal = Math.max(-1, Math.min(1, p.pan + mod.pan));
            track.bus.pan.pan.setTargetAtTime(panVal, now, 0.02);
        }
    }

    // --- SCHEDULING ---
    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2, stepIndex = 0) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id, stepIndex);
            return;
        }

        if (!this.isInitialized) await this.init();
        
        await this.ensureBufferLoaded(track);

        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0, relGrain:0, edgeCrunch:0, orbit:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.targets && lfo.targets.length > 0) {
                lfo.targets.forEach(target => {
                    if(mod[target] !== undefined) mod[target] += v;
                });
            } else if (lfo.target && mod[lfo.target]!==undefined) {
                mod[lfo.target] += v;
            }
        });

        this.syncTrackBusParams(track, time);

        const p = track.params;
        
        if (stepIndex === 0) this.lastBarStartTimes.set(track.id, time);
        let scanTime = time;
        if (track.resetOnTrig) scanTime = 0;
        else if (track.resetOnBar) scanTime = Math.max(0, time - (this.lastBarStartTimes.get(track.id) || time));

        const { absPos, actStart, actEnd } = GranularLogic.calculateEffectivePosition(p, mod, time, scanTime);

        let gainMult = 1.0;
        if (velocityLevel === 1) gainMult = 0.4;
        else if (velocityLevel === 2) gainMult = 0.75;

        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: Number(track.id),
                time: time,
                duration: (p.relGrain || 0.4) + mod.relGrain,
                stepIndex: stepIndex,
                params: {
                    position: absPos,
                    windowStart: actStart,
                    windowEnd: actEnd,
                    grainSize: Math.max(0.005, p.grainSize + mod.grainSize),
                    pitch: Math.max(0.01, p.pitch + mod.pitch),
                    density: Math.max(1, p.density + mod.density),
                    spray: Math.max(0, p.spray + mod.spray),
                    pan: p.pan || 0,
                    gain: gainMult,
                    overlap: Math.max(0, (p.overlap || 0) + mod.overlap),
                    scanSpeed: p.scanSpeed + mod.scanSpeed,
                    edgeCrunch: Math.max(0, Math.min(1, (p.edgeCrunch || 0) + mod.edgeCrunch)),
                    orbit: Math.max(0, Math.min(1, (p.orbit || 0) + mod.orbit)),
                    cleanMode: !!track.cleanMode,
                    resetOnBar: !!track.resetOnBar,
                    resetOnTrig: !!track.resetOnTrig
                }
            }
        });

        scheduleVisualDrawCallback(time, track.id, stepIndex);
    }
    
    stopAll() {
        if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' });
    }
    
    getActiveGrainCount() { return this.activeGrains; }
    setMaxGrains(max) { 
        if (this.workletNode) {
            this.workletNode.port.postMessage({
                type: 'setMaxGrains',
                data: { max }
            });
        }
    }
}