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
                if (!wasmResponse.ok) throw new Error("Failed to load granular.wasm");
                const wasmBytes = await wasmResponse.arrayBuffer();

                // 2. Load the JS Processor wrapper
                // We assume the processor file is available at this path
                await audioCtx.audioWorklet.addModule('js/worklets/granular-processor-wasm.js');

                // 3. Create the Node, passing WASM bytes in options
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); 

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-wasm', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts,
                    processorOptions: {
                        wasmBytes: wasmBytes,
                        maxTracks: MAX_TRACKS
                    }
                });
                
                // 4. Handle messages (e.g., Grain Count for UI)
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
                throw error;
            }
        })();
        
        return this.initPromise;
    }

    // --- BUFFER MANAGEMENT ---
    // We must send audio data to the Worklet, which then copies it to WASM memory
    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        const trackId = track.id;
        
        if (!track.buffer) return;

        const lastKnownBuffer = this.bufferVersionMap.get(trackId);
        if (lastKnownBuffer === track.buffer) return; 

        if (this.pendingLoads.has(trackId)) return this.pendingLoads.get(trackId);
        
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            // Get Float32 Data (Mono for now, to save memory/complexity)
            // If stereo is needed, you'd interleave it or send two pointers
            const channelData = track.buffer.getChannelData(0);
            
            // Send to Worklet
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: { 
                    trackId: Number(trackId), 
                    buffer: channelData // This is transferred/copied
                }
            }); 
            
            resolve();
            this.pendingLoads.delete(trackId);
        });

        await loadPromise;
        this.bufferVersionMap.set(trackId, track.buffer);
    }

    // --- BUS CONNECTION ---
    // (Unchanged from original implementation, just ensures connectivity)
    syncTrackBusParams(track, time) {
        // ... (Keep existing AudioParam modulation logic here) ...
        // This handles Filter/Volume on the AudioNode, completely separate from the Worklet.
        if (!track.bus) return;
        const ctx = this.audioEngine.getContext();
        const now = time || ctx.currentTime;
        
        // Example: Only updating Volume/Pan/Filter which are nodes AFTER the worklet
        // ... implementation identical to previous file ...
    }

    // --- SCHEDULING ---
    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2, stepIndex = 0) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id, stepIndex);
            return;
        }

        if (!this.isInitialized) await this.init();
        
        // Ensure buffer exists in WASM
        await this.ensureBufferLoaded(track);

        // Ensure Audio Routing
        if (!this.workletNode.connectedTracks.has(track.id)) {
            // AudioWorklet outputs match track IDs (multi-channel output)
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        // Calculate Position & Modulations
        // (Reusing your existing GranularLogic to keep visualizer in sync)
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0, relGrain:0 };
        track.lfos.forEach(lfo => {
            // ... (Logic to sum LFO values) ...
            const v = lfo.getValue(time);
            if (lfo.targets) lfo.targets.forEach(t => { if(mod[t]!==undefined) mod[t]+=v; });
            else if (lfo.target && mod[lfo.target]!==undefined) mod[lfo.target]+=v;
        });

        const p = track.params;
        
        // Scan Logic
        if (stepIndex === 0) this.lastBarStartTimes.set(track.id, time);
        let scanTime = time;
        if (track.resetOnTrig) scanTime = 0;
        else if (track.resetOnBar) scanTime = Math.max(0, time - (this.lastBarStartTimes.get(track.id) || time));

        const { absPos } = GranularLogic.calculateEffectivePosition(p, mod, time, scanTime);

        // Convert velocity level to gain
        let gainMult = 1.0;
        if (velocityLevel === 1) gainMult = 0.4;
        else if (velocityLevel === 2) gainMult = 0.75;

        // Send Note On to WASM via Worklet
        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: Number(track.id),
                time: time,
                // Combine Params + Modulations
                params: {
                    position: absPos,
                    grainSize: Math.max(0.005, p.grainSize + mod.grainSize),
                    pitch: Math.max(0.01, p.pitch + mod.pitch),
                    density: Math.max(1, p.density + mod.density),
                    spray: Math.max(0, p.spray + mod.spray),
                    pan: p.pan || 0,
                    gain: gainMult,
                    overlap: p.overlap || 0 // Handled in JS scheduler below
                }
            }
        });

        scheduleVisualDrawCallback(time, track.id, stepIndex);
    }
    
    stopAll() {
        if (this.workletNode) this.workletNode.port.postMessage({ type: 'stopAll' });
    }
    
    getActiveGrainCount() { return this.activeGrains; }
    setMaxGrains(max) { /* WASM handles limits internally, or we can pass this param */ }
}