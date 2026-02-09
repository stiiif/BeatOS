// js/core/GranularSynthWorklet.js
// WASM-Enabled Granular Synthesizer

import { MAX_TRACKS } from '../utils/constants.js';
import { GranularLogic } from '../utils/GranularLogic.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        
        // WASM State
        this.wasmMemory = null;
        this.wasmExports = null;
        
        // Memory Management
        this.trackBufferPointers = new Map(); // TrackID -> WASM Pointer
        this.bufferVersionMap = new Map();
        
        // Logic
        this.lastBarStartTimes = new Map();
        this.activeGrains = 0;
    }

    async init() {
        if (this.isInitialized) return;

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx) throw new Error("No Audio Context");

        try {
            // UPDATED PATH: Pointing to the public folder where the WASM file resides
            const response = await fetch('public/dsp.wasm'); 
            
            if (!response.ok) {
                throw new Error(`WASM Fetch failed: ${response.status} ${response.statusText}. Ensure public/dsp.wasm exists.`);
            }

            const wasmBytes = await response.arrayBuffer();
            const wasmModule = await WebAssembly.compile(wasmBytes);

            const workletCode = this.getJsProcessorCode();
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            await audioCtx.audioWorklet.addModule(url);
            
            // Create Node
            this.workletNode = new AudioWorkletNode(audioCtx, 'wasm-granular-processor', {
                numberOfInputs: 0,
                numberOfOutputs: MAX_TRACKS,
                outputChannelCount: new Array(MAX_TRACKS).fill(2),
                processorOptions: {
                    wasmModule: wasmModule // Pass compiled module
                }
            });

            this.workletNode.port.onmessage = (e) => {
                if (e.data.type === 'grainCount') {
                    this.activeGrains = e.data.count;
                }
                // Add debug log forwarding
                if (e.data.type === 'log') {
                    console.log(`[WASM-Worklet] ${e.data.message}`);
                }
            };

            this.isInitialized = true;
            console.log("[GranularWASM] Initialized successfully.");

        } catch (e) {
            console.error("[GranularWASM] Failed to init:", e);
        }
    }

    /**
     * Uploads an AudioBuffer to WASM memory
     */
    async ensureBufferLoaded(track) {
        if (!this.workletNode) return;
        const trackId = track.id;
        const buffer = track.buffer;

        // Check cache
        if (this.bufferVersionMap.get(trackId) === buffer) return;

        // Get raw data (Mono for now, granular usually sums or uses ch0)
        const channelData = buffer.getChannelData(0);
        
        // Send to Worklet
        this.workletNode.port.postMessage({
            type: 'setBuffer',
            trackId: trackId,
            data: channelData
        });

        this.bufferVersionMap.set(trackId, buffer);
    }

    scheduleNote(track, time, visualizerCallback, velocityLevel = 2, stepIndex = 0) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            visualizerCallback(time, track.id, stepIndex);
            return;
        }

        // WASM Path
        this.ensureBufferLoaded(track);

        if (!this.workletNode.connectedTracks) this.workletNode.connectedTracks = new Set();
        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }
        
        this.syncTrackBusParams(track, time);

        // Calculate Params (GranularLogic)
        const p = this.calculateParams(track, time, stepIndex); 

        // Send Command to Worklet
        this.workletNode.port.postMessage({
            type: 'spawn',
            trackId: track.id,
            time: time,
            duration: p.duration,
            params: {
                position: p.absPos,
                // Pass raw modulation values or pre-calculated
                pitch: p.pitch,
                grainSize: p.grainSize,
                density: p.density,
                velocity: p.velocity,
                cleanMode: track.cleanMode ? 1 : 0,
                edgeCrunch: p.edgeCrunch
            }
        });

        visualizerCallback(time, track.id, stepIndex);
    }

    syncTrackBusParams(track, time = null) {
        if (!track.bus || !this.audioEngine.getContext()) return;
        const ctx = this.audioEngine.getContext();
        const now = time !== null ? time : ctx.currentTime;
        const p = track.params;

        let mod = { filter: 0, hpFilter: 0, volume: 0, pan: 0 };
        
        // Recalculate modulation for Bus parameters (Filters/Vol/Pan)
        // This runs in Main Thread, so it's fine to keep JS logic here.
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

    calculateParams(track, time, stepIndex) {
        // --- 1. LFO Modulation ---
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
        
        // --- 2. Velocity Gain ---
        // stepIndex logic or velocityLevel passed from Scheduler?
        // Note: Scheduler passes velocityLevel 1,2,3 or 0.
        // We need to retrieve the velocity level if not passed explicitly in this struct, 
        // but scheduleNote receives `velocityLevel`.
        // Let's assume velocityLevel is handled by caller (scheduler) and passed to `scheduleNote`.
        // Wait, scheduleNote argument `velocityLevel` is used in logic.
        // We need to grab it here.
        // Actually `velocityLevel` is passed to `scheduleNote`, but not into `calculateParams`.
        // We will just return 1.0 for now and let `scheduleNote` apply the multiplier.
        // CORRECTION: scheduleNote applies the multiplier before sending to WASM.
        
        // --- 3. Scan / Reset Logic ---
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

        // --- 4. Effective Position ---
        const { absPos, actStart, actEnd } = GranularLogic.calculateEffectivePosition(p, mod, time, scanTime);

        // --- 5. Assemble ---
        return {
            absPos: absPos,
            duration: (p.relGrain || 0.4) + mod.relGrain,
            pitch: Math.max(0.01, (p.pitch || 1.0) + mod.pitch),
            grainSize: Math.max(0.005, (p.grainSize || 0.1) + mod.grainSize),
            density: Math.max(1, (p.density || 20) + mod.density),
            // Velocity handled in scheduleNote, here we return base 1.0 if modded later
            velocity: 1.0, 
            edgeCrunch: Math.max(0, Math.min(1, (p.edgeCrunch || 0) + mod.edgeCrunch))
        };
    }

    getJsProcessorCode() {
        // This code runs inside the AudioWorkletGlobalScope
        return `
        class WasmGranularProcessor extends AudioWorkletProcessor {
            constructor(options) {
                super();
                this.wasmInstance = null;
                this.memory = null;
                this.outputBufferPtr = 0;
                this.trackPtrs = new Map();
                this.activeNotes = [];
                this.lastReportedCount = 0;
                this.logTimer = 0;

                this.initWasm(options.processorOptions.wasmModule);
                
                this.port.onmessage = (e) => this.handleMessage(e.data);
            }

            async initWasm(module) {
                try {
                    const instance = await WebAssembly.instantiate(module, {
                        env: {
                            abort: () => console.error("WASM Abort")
                        }
                    });
                    this.wasmInstance = instance;
                    this.exports = instance.exports;
                    this.memory = new Float32Array(this.exports.memory.buffer);
                    
                    this.exports.init();
                    this.outputBufferPtr = this.exports.getOutputBufferPtr();
                    console.log("[WASM-Processor] Initialized. Output Ptr:", this.outputBufferPtr);
                } catch (e) {
                    console.error("[WASM-Processor] Instantiation Error:", e);
                }
            }

            handleMessage(msg) {
                if (!this.exports) return;

                if (msg.type === 'setBuffer') {
                    console.log("[WASM-Processor] Setting Buffer for Track:", msg.trackId, "Length:", msg.data.length);
                    const len = msg.data.length;
                    const ptr = this.exports.allocateBuffer(len);
                    
                    // Re-acquire memory view in case of growth
                    this.memory = new Float32Array(this.exports.memory.buffer);
                    this.memory.set(msg.data, ptr >> 2); 
                    
                    this.exports.setTrackBuffer(msg.trackId, ptr, len);
                }
                else if (msg.type === 'spawn') {
                    // console.log("[WASM-Processor] Scheduling Spawn. Track:", msg.trackId, "Time:", msg.time);
                    this.activeNotes.push({
                        time: msg.time,
                        trackId: msg.trackId,
                        params: msg.params,
                        nextSpawn: msg.time,
                        spawnCount: 0
                    });
                }
                else if (msg.type === 'stopAll') {
                    console.log("[WASM-Processor] Stop All Command Received");
                    this.exports.stopAll();
                    this.activeNotes = [];
                }
            }

            process(inputs, outputs, parameters) {
                if (!this.exports) return true;
                
                const now = currentTime; 
                const frameCount = 128; // Standard Web Audio block size
                
                // Debug Scheduler
                // if (this.activeNotes.length > 0 && this.logTimer++ % 50 === 0) {
                //    console.log("[WASM-Scheduler] Active Notes: this.activeNotes.length, Time: now.toFixed(3)");
                // }

                // 1. Scheduler
                for (let i = this.activeNotes.length - 1; i >= 0; i--) {
                    const note = this.activeNotes[i];
                    
                    // Simple limit per note to prevent infinite loops if density is high
                    let noteSpawns = 0;
                    const spawnLimit = 5;

                    // Use a slightly larger lookahead to ensure we don't miss grains
                    // frameCount / sampleRate approx 0.0029s at 44.1kHz
                    while (note.nextSpawn < now + (frameCount / sampleRate) && noteSpawns < spawnLimit) {
                        if (note.nextSpawn >= now) {
                            const sampleRateVal = sampleRate; // Global in AudioWorklet
                            const lenSamples = Math.floor(note.params.grainSize * sampleRateVal);
                            
                            // Debug Spawn
                            // console.log("[WASM-Processor] Spawning Grain. Track:", note.trackId, "Pos:", note.params.position.toFixed(3), "Len:", lenSamples);
                            
                            this.exports.spawnGrain(
                                note.trackId,
                                note.params.position,
                                lenSamples,
                                note.params.pitch,
                                note.params.velocity, // Includes gainMult
                                !!note.params.cleanMode,
                                note.params.edgeCrunch
                            );
                        }
                        
                        const interval = 1.0 / Math.max(0.1, note.params.density);
                        note.nextSpawn += interval;
                        noteSpawns++;
                    }
                    
                    if (now > note.time + note.params.duration) {
                        // console.log("[WASM-Processor] Note Finished. Track:", note.trackId);
                        this.activeNotes.splice(i, 1);
                    }
                }

                // 2. Run DSP
                this.exports.process(frameCount);

                // 3. Copy Outputs
                // WASM Output is interleaved blocks: [Track0_L][Track0_R][Track1_L]...
                // Re-acquire memory view every block is safest for WASM growth, but slightly costly.
                // Given the specific symptoms, let's ensure we are reading from the correct view.
                const mem = new Float32Array(this.exports.memory.buffer); 
                const basePtr = this.outputBufferPtr >> 2; // Convert byte offset to float32 index
                const blockSize = 128;
                
                // Debug: Check for output explosion (NaN or Infinity or very large values)
                // Only check every ~100 blocks to save CPU
                if (this.logTimer++ % 100 === 0 && outputs[0] && outputs[0][0]) {
                     // Check first sample of first active output
                     const sample = mem[basePtr];
                     if (Math.abs(sample) > 1.0) {
                         this.port.postMessage({ type: 'log', message: "Output clipping detected: " + sample });
                     } else if (Math.abs(sample) > 0.0001) {
                         // this.port.postMessage({ type: 'log', message: "Output active: " + sample });
                     }
                     
                     // Check active grains every second or so
                     // this.port.postMessage({ type: 'grainCount', count: this.activeNotes.length }); // Note: this is scheduled notes not voices
                }

                for (let t = 0; t < outputs.length; t++) {
                    const output = outputs[t];
                    if (!output || output.length === 0) continue;
                    
                    // 2 channels * 128 samples * trackIndex
                    const trackOffset = t * 2 * blockSize;
                    
                    const leftPtr = basePtr + trackOffset;
                    const rightPtr = basePtr + trackOffset + blockSize;
                    
                    // Safety check bounds
                    if (leftPtr + blockSize <= mem.length) {
                         const leftWasm = mem.subarray(leftPtr, leftPtr + blockSize);
                         output[0].set(leftWasm);
                    }
                    
                    if (output[1] && rightPtr + blockSize <= mem.length) {
                        const rightWasm = mem.subarray(rightPtr, rightPtr + blockSize);
                        output[1].set(rightWasm);
                    }
                }

                return true;
            }
        }
        registerProcessor('wasm-granular-processor', WasmGranularProcessor);
        `;
    }

    // Add this method to expose active grain count
    getActiveGrainCount() {
        return this.activeGrains;
    }
    
    // Add this method to allow setting max grains if needed (for UI compatibility)
    setMaxGrains(max) {
        // Currently no-op or implement if WASM supports it later
        // this.workletNode.port.postMessage({ type: 'setMaxGrains', data: { max } });
    }
}