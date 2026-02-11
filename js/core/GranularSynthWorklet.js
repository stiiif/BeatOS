// Granular SynthWorklet - Updated for Wasm Migration
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
        this._debugDirectConnectDone = false;
    }

    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            console.log('[Granular] Starting Initialization...');
            const audioCtx = this.audioEngine.getContext();
            if (!audioCtx) throw new Error('AudioContext not available');
            
            try {
                if (audioCtx.state === 'suspended') {
                    console.log('[Granular] Resuming AudioContext...');
                    await audioCtx.resume();
                }

                // CACHE BUSTER: Force reload of the Worklet processor file
                const modulePath = `js/worklets/granular-processor.js?t=${Date.now()}`;
                console.log(`[Granular] Loading Processor: ${modulePath}`);
                await audioCtx.audioWorklet.addModule(modulePath);
                
                const wasmResponse = await fetch('public/dsp.wasm');
                if (!wasmResponse.ok) throw new Error(`Failed to load Wasm: ${wasmResponse.statusText}`);
                const wasmBytes = await wasmResponse.arrayBuffer();
                const wasmModule = await WebAssembly.compile(wasmBytes);
                
                if (!(wasmModule instanceof WebAssembly.Module)) {
                    throw new Error("Compiled Wasm is not a valid WebAssembly.Module instance");
                }
                console.log('[Granular] Wasm Compiled Successfully. Module Size:', wasmBytes.byteLength);

                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 
                
                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS, 
                    outputChannelCount: outputChannelCounts,
                    channelCount: 2,           
                    channelCountMode: 'explicit',
                    processorOptions: {}
                });
                
                // CRITICAL: Catch Deserialization Errors (DataCloneError)
                this.workletNode.port.onmessageerror = (err) => {
                    console.error('[Granular] ❌ Port Message Error (Deserialization Failed?):', err);
                };

                this.workletNode.onprocessorerror = (err) => {
                    console.error('[Granular] ❌ Worklet Processor Error:', err);
                };

                this.workletNode.port.onmessage = (event) => {
                    if (event.data.type === 'grainCount') {
                        this.activeGrains = event.data.count;
                    }
                };
                
                // Ensure port is started (usually automatic, but being safe)
                this.workletNode.port.start();

                // FIX: Bombardment Strategy
                const sendWasm = (attempt) => {
                    if (!this.workletNode) return;
                    console.log(`[Granular] 🚀 Sending Wasm Module to Worklet (Attempt ${attempt})...`);
                    try {
                        this.workletNode.port.postMessage({
                            type: 'initWasm',
                            data: { module: wasmModule }
                        });
                    } catch (e) {
                        console.error(`[Granular] ❌ postMessage Failed (Attempt ${attempt}):`, e);
                    }
                };

                // Test Basic Connectivity first
                this.workletNode.port.postMessage({ type: 'ping', data: {} });

                // 1. Immediate
                sendWasm(1);
                // 2. Short Delay
                setTimeout(() => sendWasm(2), 200);
                // 3. Long Delay
                setTimeout(() => sendWasm(3), 1000);

                this.workletNode.connectedTracks = new Set();
                this.isInitialized = true;
                window.granularWorklet = this; // Debug access
                
                console.log('[GranularSynthWorklet] ✅ Wasm DSP Engine Ready');
            } catch (error) {
                console.error('[GranularSynthWorklet] Initialization failed:', error);
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = Number(track.id); 
        if (!track.buffer) return;

        const lastKnownBuffer = this.bufferVersionMap.get(trackId);
        if (lastKnownBuffer === track.buffer) return; 

        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            const channelData = track.buffer.getChannelData(0);
            const bufferCopy = new Float32Array(channelData);
            
            // Allow time for initWasm to process before sending buffers
            const delay = this.isInitialized ? 0 : 200;
            
            setTimeout(() => {
                if (this.workletNode) {
                    this.workletNode.port.postMessage({
                        type: 'setBuffer',
                        data: { trackId: trackId, buffer: bufferCopy }
                    }, [bufferCopy.buffer]); 
                }
                resolve();
                this.pendingLoads.delete(trackId);
            }, delay);
        });

        await loadPromise;
        this.bufferVersionMap.set(trackId, track.buffer);
    }

    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2, stepIndex = 0) {
        try {
            if (track.type === 'simple-drum') {
                this.audioEngine.triggerDrum(track, time, velocityLevel);
                scheduleVisualDrawCallback(time, track.id, stepIndex);
                return;
            }

            if (!this.isInitialized) await this.init();
            const ctx = this.audioEngine.getContext();

            if (!ctx || !track.buffer || !track.bus) return;

            await this.ensureBufferLoaded(track);
            const trackId = Number(track.id);

            // Connection Logic
            if (!this.workletNode.connectedTracks.has(trackId)) {
                if (track.bus.input) {
                    try {
                        this.workletNode.connect(track.bus.input, trackId, 0);
                        this.workletNode.connectedTracks.add(trackId);
                    } catch(e) { console.error('Connection Error:', e); }
                }
                
                // FORCE AUDIO: Direct connection for Track 0
                if (trackId === 0 && !this._debugDirectConnectDone) {
                    console.log('Connecting Track 0 to Speakers (Debug)');
                    this.workletNode.connect(ctx.destination, 0, 0);
                    this._debugDirectConnectDone = true;
                }
            }

            this.syncTrackBusParams(track, time);

            let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, relGrain:0 };
            if (track.lfos) {
                track.lfos.forEach(lfo => {
                    const v = lfo.getValue(time);
                    if (lfo.targets) lfo.targets.forEach(target => { if(mod[target] !== undefined) mod[target] += v; });
                    else if (lfo.target && mod[lfo.target] !== undefined) mod[lfo.target] += v;
                });
            }

            const p = track.params || {};
            const { absPos } = GranularLogic.calculateEffectivePosition(p, mod, time, 0);

            // Safe Defaults
            const density = Math.max(1, (p.density ?? 20) + mod.density);
            const grainDuration = Math.max(0.005, (p.grainSize ?? 0.1) + mod.grainSize);
            const duration = (p.relGrain ?? 0.4) + mod.relGrain;
            const interval = 1.0 / density;
            
            let nextGrainTime = time;
            const endNoteTime = time + duration;
            
            while (nextGrainTime < endNoteTime) {
                this.workletNode.port.postMessage({
                    type: 'noteOn',
                    data: {
                        trackId: trackId,
                        time: nextGrainTime,
                        params: {
                            position: absPos,
                            grainSize: grainDuration,
                            pitch: Math.max(0.01, (p.pitch ?? 1.0) + mod.pitch),
                            velocity: velocityLevel === 1 ? 0.4 : 1.0,
                            spray: Math.max(0, (p.spray ?? 0) + mod.spray)
                        }
                    }
                });
                nextGrainTime += interval;
            }

            if (scheduleVisualDrawCallback) scheduleVisualDrawCallback(time, track.id, stepIndex);

        } catch (err) {
            console.error('[Granular] CRASH:', err);
        }
    }
    
    syncTrackBusParams(track, time = null) {
        try {
            if (!track.bus || !this.audioEngine.getContext()) return;
            const ctx = this.audioEngine.getContext();
            const now = time !== null ? time : ctx.currentTime;
            const p = track.params || {};
            // Basic volume sync (simplified for robustness)
            if (track.bus.vol) track.bus.vol.gain.setTargetAtTime(p.volume ?? 0.8, now, 0.05);
        } catch (e) {}
    }

    stopAll() { if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' }); }
    getActiveGrainCount() { return this.activeGrains; }
    setMaxGrains(max) {}
}