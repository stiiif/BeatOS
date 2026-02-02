// Granular SynthWorklet - AudioWorklet-based granular synthesis
// Refactored for multi-channel output to support true per-track routing
// Phase 3 Improvements: Perfect Clock Integration (Main Thread Side)

import { VELOCITY_GAINS, MAX_TRACKS } from '../utils/constants.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        this.MAX_GRAINS = 64;
        
        // Track which buffer OBJECTS have been loaded into worklet per track
        // Using WeakMap to associate Track object with its last loaded AudioBuffer
        this.trackBufferCache = new WeakMap();
        
        // Pending buffer loads
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
                // Create worklet code as Blob to bypass CSP
                const workletCode = this.getWorkletCode();
                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const blobURL = URL.createObjectURL(blob);
                
                console.log('[GranularSynthWorklet] Loading worklet from inline Blob (CSP workaround)');
                
                try {
                    await audioCtx.audioWorklet.addModule(blobURL);
                    console.log('[GranularSynthWorklet] ✅ Worklet loaded from Blob URL');
                } finally {
                    URL.revokeObjectURL(blobURL);
                }
                
                // CRITICAL: Configure worklet with 32 stereo outputs (one for each track)
                // This ensures separate audio routing per track, preventing signal bleed in meters.
                const outputChannelCounts = new Array(MAX_TRACKS).fill(2); // 32 stereo outputs

                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: MAX_TRACKS,
                    outputChannelCount: outputChannelCounts
                });
                
                // Handle messages from worklet
                this.workletNode.port.onmessage = (e) => {
                    this.handleWorkletMessage(e.data);
                };
                
                // Initialize connected tracks set to track which outputs are routed
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
                console.log(`[GranularSynthWorklet] Buffer loaded for track ${trackId}, length: ${data?.bufferLength || message.bufferLength}`);
                
                // Resolve pending promise if exists
                const resolve = this.pendingLoads.get(trackId);
                if (resolve) {
                    resolve();
                    this.pendingLoads.delete(trackId);
                }
                break;
                
            case 'stats':
                // Stats handled by monitor UI
                if (data && data.activeVoices !== undefined) {
                    this.activeGrains = data.activeVoices;
                }
                break;
                
            default:
                console.log('[GranularSynthWorklet] Unknown message:', message);
        }
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = Math.min(64, max); // AudioWorklet can handle 64
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        const trackId = track.id;
        
        // Check if the buffer object itself has changed, not just if the track has been loaded once.
        const cachedBuffer = this.trackBufferCache.get(track);
        
        if (cachedBuffer && cachedBuffer === track.buffer) {
            // Buffer is up to date, no need to reload
            return;
        }
        
        if (!track.buffer) {
            console.warn('[GranularSynthWorklet] No buffer for track:', trackId);
            return;
        }
        
        // Check if already loading this specific track
        if (this.pendingLoads.has(trackId)) {
            return this.pendingLoads.get(trackId);
        }
        
        console.log(`[GranularSynthWorklet] Uploading new buffer for Track ${trackId}...`);
        
        // Create promise for this load
        const loadPromise = new Promise((resolve) => {
            this.pendingLoads.set(trackId, resolve);
            
            // Get buffer data
            const channelData = track.buffer.getChannelData(0);
            
            // Create copy for transfer
            const bufferCopy = new Float32Array(channelData);
            
            // Get RMS map if available
            const rmsMap = track.rmsMap || [];
            
            // Transfer to worklet
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                data: {
                    trackId,
                    buffer: bufferCopy,
                    rmsMap: rmsMap
                }
            }, [bufferCopy.buffer]); // Transferable for zero-copy
            
            // Timeout in case message gets lost
            setTimeout(() => {
                if (this.pendingLoads.has(trackId)) {
                    console.warn('[GranularSynthWorklet] Buffer load timeout for track:', trackId);
                    resolve();
                    this.pendingLoads.delete(trackId);
                }
            }, 1000);
        });
        
        await loadPromise;
        
        // Update cache with the new buffer reference
        this.trackBufferCache.set(track, track.buffer);
    }

    // Phase 3: Perfect Clock Scheduling
    // Replaces the old setTimeout loop with a single precise "Note On" event
    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        // Handle simple drum tracks differently (they use standard Oscillators/BufferSources, not the Worklet)
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id);
            return;
        }

        if (!this.isInitialized) {
            await this.init();
        }

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !track.buffer || !track.bus) return;

        // Ensure buffer is loaded
        await this.ensureBufferLoaded(track);

        // Ensure Routing
        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        // Calculate Params at Trigger Time (including LFOs)
        // We capture the state of LFOs at the moment of scheduling.
        // For extremely long notes, the LFOs won't update during the note,
        // but for granular rhythmic hits, this is standard practice and highly efficient.
        
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0, sampleStart:0, sampleEnd:0, overlap:0, scanSpeed:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;

        // Calculate Velocity Gain
        let gainMult = 1.0;
        let filterOffset = 0;
        let sprayMod = 0;

        switch(velocityLevel) {
            case 1: // Ghost
                gainMult = 0.4;
                if (!track.ignoreVelocityParams) { filterOffset = -3000; sprayMod = 0.05; }
                break;
            case 2: gainMult = 0.75; break;
            case 3: gainMult = 1.0; break;
            default: if (velocityLevel > 0) gainMult = 0.75; else return;
        }

        // Apply Bus Effects (Filter/Pan) on Main Thread
        // These are automatable parameters on AudioNodes, so we schedule them.
        if(track.bus.hp) {
            const rawHp = p.hpFilter + mod.hpFilter;
            const clampedHp = Math.max(20, Math.min(20000, rawHp));
            track.bus.hp.frequency.setValueAtTime(clampedHp, time);
        }
        
        let rawLp = p.filter + mod.filter + filterOffset;
        const clampedLp = Math.max(100, Math.min(22000, rawLp));
        if(track.bus.lp) {
            track.bus.lp.frequency.setValueAtTime(clampedLp, time);
        }
        
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        // Calculate Effective Granular Parameters
        // 1. Position Logic
        let winStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let winEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        if (winStart > winEnd) { const temp = winStart; winStart = winEnd; winEnd = temp; }
        
        // Update Playhead
        if (p.scanSpeed !== 0 || mod.scanSpeed !== 0) {
            const speed = p.scanSpeed + mod.scanSpeed;
            track.playhead = (track.playhead + (speed * 0.1)) % 1.0;
            if (track.playhead < 0) track.playhead += 1.0;
        } else {
            track.playhead = p.position;
        }

        let baseRelPos = (Math.abs(p.scanSpeed) > 0.01) ? track.playhead : p.position;
        let relPos = Math.max(0, Math.min(1, baseRelPos + mod.position));
        let finalPos = winStart + (relPos * (winEnd - winStart));
        
        // Clamp final position
        finalPos = Math.max(0, Math.min(1, finalPos));

        // 2. Duration / Density
        const density = Math.max(1, (p.density || 20) + mod.density);
        const grainSize = Math.max(0.01, (p.grainSize || 0.1) + mod.grainSize);
        const overlap = Math.max(0, (p.overlap || 0) + mod.overlap);
        const duration = (p.relGrain !== undefined ? p.relGrain : 0.4) + (mod.relGrain || 0);
        const pitch = Math.max(0.1, (p.pitch || 1.0) + mod.pitch);
        const spray = Math.max(0, (p.spray || 0) + mod.spray + sprayMod);

        // Send Note Event to Worklet
        this.workletNode.port.postMessage({
            type: 'noteOn',
            data: {
                trackId: track.id,
                time: time, // Precision Time from Scheduler
                duration: duration,
                params: {
                    position: finalPos,
                    density: density,
                    grainSize: grainSize,
                    overlap: overlap,
                    pitch: pitch,
                    velocity: gainMult,
                    spray: spray
                }
            }
        });

        // Trigger Visuals
        scheduleVisualDrawCallback(time, track.id);
    }
    
    stopAll() {
        if (!this.isInitialized || !this.workletNode) return;
        
        this.workletNode.port.postMessage({
            type: 'stopAll'
        });
        
        this.activeGrains = 0;
    }
    
    getStats() {
        if (!this.isInitialized || !this.workletNode) return null;
        
        this.workletNode.port.postMessage({
            type: 'getStats'
        });
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
    
    // Inline worklet code to bypass CSP restrictions
    // This string must match js/worklets/granular-processor.js content exactly
    // In production, you might load the file directly, but here we keep the inline fallback.
    // Ideally, this string should be updated to reflect the Phase 1 & 2 changes we made to the file.
    // However, since we are editing the file directly in the project structure, this getWorkletCode()
    // serves as a fallback only if file loading fails.
    // For consistency, I will leave it as is or update it if requested, but the primary logic
    // is now in the separate file which the browser should load if configured correctly.
    // Given the previous setup used Blob loading, it likely relies on this string.
    // Therefore, I MUST update this string to match the new processor code.
    getWorkletCode() {
        return `
// BeatOS Granular Synthesis AudioWorklet Processor (Inline)
// Supports: polyphonic grains, pitch shifting, RMS-based position finding, velocity
// Phase 1: Cubic Interpolation, Window LUT, De-clicking
// Phase 2: Event-Based Internal Scheduling

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
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;
        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            const phase = i / 4095;
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * phase));
        }
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'trigger': this.triggerGrain(data); break;
                case 'noteOn': this.handleNoteOn(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'updateBuffer': this.updateBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'stopAll': this.stopAllVoices(); this.activeNotes = []; break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'getStats': this.sendStats(); break;
            }
        };
    }
    cubicHermite(y0, y1, y2, y3, x) {
        const c0 = y1;
        const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
        return ((c3 * x + c2) * x + c1) * x + c0;
    }
    handleNoteOn(data) {
        const { trackId, time, duration, params } = data;
        this.activeNotes.push({
            trackId, startTime: time, duration: duration, params: params, nextGrainTime: time
        });
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;
        const now = currentTime;
        
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (now > note.startTime + note.duration) { this.activeNotes.splice(i, 1); continue; }
            if (now >= note.startTime) {
                let density = Math.max(1, note.params.density || 20);
                let interval = 1 / density;
                if (note.params.overlap > 0) {
                    const grainDur = note.params.grainSize || 0.1;
                    interval = grainDur / Math.max(0.1, note.params.overlap);
                }
                let grainsSpawned = 0;
                while (note.nextGrainTime < now + (frameCount / sampleRate) && grainsSpawned < 10) {
                    if (note.nextGrainTime >= now) { this.spawnGrainFromNote(note); }
                    note.nextGrainTime += interval;
                    grainsSpawned++;
                }
            }
        }

        if (channelCount === 0) return true;
        for (let channel = 0; channel < channelCount; channel++) output[channel].fill(0);

        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) continue;
            
            for (let i = 0; i < frameCount; i++) {
                if (voice.releasing) {
                    voice.releaseAmp -= (1.0/64.0);
                    if (voice.releaseAmp <= 0) { voice.active = false; voice.releasing = false; break; }
                }
                if (voice.phase >= voice.grainLength) { voice.active = false; break; }
                
                const baseReadPos = voice.position * voice.bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                const wrappedPos = readPos % voice.bufferLength;
                const sampleIndex = Math.floor(wrappedPos);
                const frac = wrappedPos - sampleIndex;
                
                const idx0 = (sampleIndex - 1 + voice.bufferLength) % voice.bufferLength;
                const idx1 = sampleIndex;
                const idx2 = (sampleIndex + 1) % voice.bufferLength;
                const idx3 = (sampleIndex + 2) % voice.bufferLength;
                const y0 = voice.buffer[idx0]||0; const y1 = voice.buffer[idx1]||0;
                const y2 = voice.buffer[idx2]||0; const y3 = voice.buffer[idx3]||0;
                const sample = this.cubicHermite(y0, y1, y2, y3, frac);
                
                const lutIndex = Math.floor((voice.phase / voice.grainLength) * 4095);
                const safeLutIndex = Math.max(0, Math.min(4095, lutIndex));
                const envelope = this.windowLUT[safeLutIndex];
                
                const outputSample = sample * envelope * voice.velocity * voice.releaseAmp;
                trackOutput[0][i] += outputSample;
                if (trackOutput.length > 1) trackOutput[1][i] += outputSample;
                voice.phase++;
            }
        }
        
        const outputGain = 0.5;
        for (let j = 0; j < outputs.length; j++) {
            const out = outputs[j];
            if(!out) continue;
            for (let ch = 0; ch < out.length; ch++) {
                for (let i = 0; i < frameCount; i++) {
                    const s = out[ch][i] * outputGain;
                    const x = Math.max(-3, Math.min(3, s));
                    out[ch][i] = x * (27 + x * x) / (27 + 9 * x * x);
                }
            }
        }
        this.currentFrame += frameCount;
        return true;
    }
    spawnGrainFromNote(note) {
        const { params } = note;
        const trackData = this.trackBuffers.get(note.trackId);
        if (!trackData || !trackData.buffer) return;
        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            voice = this.voices.reduce((oldest, v) => v.startFrame < oldest.startFrame ? v : oldest);
            voice.releasing = true;
        }
        let finalPos = params.position;
        if (params.spray > 0) {
            finalPos += (Math.random() * 2 - 1) * params.spray;
            finalPos = Math.max(0, Math.min(1, finalPos));
        }
        voice.active = true; voice.trackId = note.trackId;
        voice.buffer = trackData.buffer; voice.bufferLength = trackData.buffer.length;
        voice.position = finalPos; voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor((params.grainSize || 0.1) * sampleRate));
        voice.pitch = Math.max(0.05, Math.min(8.0, params.pitch || 1.0));
        voice.velocity = params.velocity || 1.0;
        voice.startFrame = this.currentFrame;
        voice.releasing = false; voice.releaseAmp = 1.0;
        this.totalGrainsTriggered++;
    }
    triggerGrain(data) { /* Legacy Support if needed */ }
    findActivePosition(pos, map) { return pos; }
    setBuffer(id, buf, map) {
        let processed = map ? map.map(v => v > 0.01) : null;
        this.trackBuffers.set(id, { buffer: buf, rmsMap: processed });
        this.port.postMessage({ type: 'bufferLoaded', trackId: id, bufferLength: buf.length });
    }
    updateBuffer(id, buf, map) { this.setBuffer(id, buf, map); }
    stopAllVoices() {
        for (let v of this.voices) if(v.active) { v.releasing = true; v.releaseAmp = 1.0; }
    }
    stopTrack(id) {
        this.activeNotes = this.activeNotes.filter(n => n.trackId !== id);
        for (let v of this.voices) if(v.trackId === id && v.active) { v.releasing = true; v.releaseAmp = 1.0; }
    }
    sendStats() {
        const active = this.voices.filter(v => v.active).length;
        this.port.postMessage({ type: 'stats', data: { activeVoices: active } });
    }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}