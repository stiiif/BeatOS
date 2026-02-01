// Granular SynthWorklet - AudioWorklet-based granular synthesis
// Refactored for multi-channel output to support true per-track routing

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
        
        // BUGFIX: Check if the buffer object itself has changed, not just if the track has been loaded once.
        // We use a WeakMap (trackBufferCache) to map the Track object to the last AudioBuffer we uploaded.
        // If track.buffer is different from what's in the cache, we reload.
        
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

    async playGrain(track, time, scheduleVisualDrawCallback, ampEnvelope = 1.0, velocityLevel = 2) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (this.activeGrains >= this.MAX_GRAINS) {
            return;
        }

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !track.buffer || !track.bus) {
            return;
        }
        
        // Ensure buffer is loaded in worklet (checks for changes now)
        await this.ensureBufferLoaded(track);

        // Calculate gain multiplier based on velocity
        let gainMult = 1.0;
        let filterOffset = 0;
        let sprayMod = 0;

        switch(velocityLevel) {
            case 1: // Ghost
                gainMult = 0.4;
                // Only modify parameters if NOT ignored
                if (!track.ignoreVelocityParams) {
                    filterOffset = -3000;
                    sprayMod = 0.05;
                }
                break;
            case 2: // Normal
                gainMult = 0.75;
                break;
            case 3: // Accent
                gainMult = 1.0;
                break;
            default:
                if (velocityLevel > 0) gainMult = 0.75;
                else return;
        }

        // LFO modulation (calculated on main thread)
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0, sampleStart:0, sampleEnd:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;

        // --- NEW LOGIC: Calculate Sample Window & Mapped Position ---
        
        // 1. Calculate effective start/end with modulation (clamped 0-1)
        let winStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let winEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        
        // Ensure start < end (swap if necessary)
        if (winStart > winEnd) {
            const temp = winStart; winStart = winEnd; winEnd = temp;
        }
        
        // 2. Calculate relative position (0-1)
        // If scanning, use playhead, else use param
        let baseRelPos = (p.scanSpeed > 0.01 || p.scanSpeed < -0.01) ? track.playhead : p.position;
        
        // Add LFO modulation to relative position
        let relPos = baseRelPos + mod.position;
        
        // Clamp relative position 0-1 before mapping to avoid going out of window
        relPos = Math.max(0, Math.min(1, relPos));
        
        // 3. Map relative position to absolute window
        let gPos = winStart + (relPos * (winEnd - winStart));
        
        // 4. Apply spray (randomness) on top of the mapped position
        const spray = Math.max(0, p.spray + mod.spray + sprayMod);
        gPos += (Math.random()*2-1) * spray;
        
        // 5. Final safety clamp (ensure within buffer limits)
        gPos = Math.max(0, Math.min(1, gPos));

        // Apply filters via track bus (still on main thread for now)
        // BUGFIX: Use raw Hz values from params instead of mapping function, which distorted linear inputs.
        
        if(track.bus.hp) {
            const rawHp = p.hpFilter + mod.hpFilter;
            const clampedHp = Math.max(20, Math.min(20000, rawHp));
            track.bus.hp.frequency.setValueAtTime(clampedHp, time);
        }
        
        let rawLp = p.filter + mod.filter;
        // Filter offset is 0 if ignoreVelocityParams is true or velocity is > 1
        if (velocityLevel === 1 && !track.ignoreVelocityParams) rawLp += filterOffset;
        
        const clampedLp = Math.max(100, Math.min(22000, rawLp));
        
        if(track.bus.lp) {
            track.bus.lp.frequency.setValueAtTime(clampedLp, time);
        }
        
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);

        // CRITICAL ROUTING FIX: 
        // Ensure specific Worklet Output [track.id] is connected to Track Bus Input.
        // This connects Output N to Track N, isolating the signal path.
        if (!this.workletNode.connectedTracks.has(track.id)) {
            // connect(destination, outputIndex, inputIndex)
            this.workletNode.connect(track.bus.input, track.id, 0);
            this.workletNode.connectedTracks.add(track.id);
        }

        // Calculate when to trigger grain in worklet
        const currentTime = audioCtx.currentTime;
        const scheduledTime = Math.max(currentTime, time);
        const timeDelta = scheduledTime - currentTime;
        
        // Prevent scheduling too far in future (causes drift/crackles)
        const MAX_LOOKAHEAD = 0.5; // 500ms max
        if (timeDelta > MAX_LOOKAHEAD) {
            return; // Skip this grain
        }
        
        // Check voice limit to prevent overload
        if (this.activeGrains >= this.MAX_GRAINS) {
            return; // Skip grain if at limit
        }
        
        const delayMs = timeDelta * 1000;
        
        // Schedule grain trigger
        setTimeout(() => {
            if (!this.workletNode) return;
            
            this.workletNode.port.postMessage({
                type: 'trigger',
                data: {
                    trackId: track.id,
                    position: gPos,
                    grainSize: dur,
                    pitch: pitch,
                    velocity: ampEnvelope * gainMult,
                    spray: 0, // Already applied above
                    useRmsMap: spray > 0.01
                }
            });
            
            this.activeGrains++;
            
            // Grain will end after its duration
            setTimeout(() => {
                this.activeGrains = Math.max(0, this.activeGrains - 1);
            }, dur * 1000);
            
        }, delayMs);
        
        // Schedule visual callback
        scheduleVisualDrawCallback(time, track.id);
    }

    async scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        // Handle simple drum tracks differently (they use standard Oscillators/BufferSources, not the Worklet)
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id);
            return;
        }

        const p = track.params;
        
        let density = Math.max(1, p.density);
        let interval;
        const dur = p.grainSize; 

        if (p.overlap > 0) {
            interval = dur / Math.max(0.1, p.overlap);
            density = 1 / interval; 
        } else {
            interval = 1 / density;
        }

        const noteDur = p.relGrain !== undefined ? p.relGrain : 0.4;
        const rawGrains = Math.ceil(noteDur / interval);
        const grains = Math.min(this.MAX_GRAINS, rawGrains); 

        const atk = p.ampAttack || 0.01;
        const dec = p.ampDecay || 0.01;
        const rel = p.ampRelease || 0.01;
        const sustainLevel = 0.6;

        // Update playhead for scan mode
        if (p.scanSpeed !== 0) {
            track.playhead = (track.playhead + (p.scanSpeed * 0.1)) % 1.0;
            if (track.playhead < 0) track.playhead += 1.0;
        } else {
            track.playhead = p.position;
        }

        // Schedule all grains for this note
        for(let i=0; i<grains; i++) {
            const grainRelativeTime = i * interval;
            let ampEnv = 0;

            // First grain at full amplitude for transients
            if (i === 0) {
                ampEnv = 1.0;
            } else {
                if (grainRelativeTime < atk) {
                    ampEnv = grainRelativeTime / atk;
                } else if (grainRelativeTime < atk + dec) {
                    const decProgress = (grainRelativeTime - atk) / dec;
                    ampEnv = 1.0 - (decProgress * (1.0 - sustainLevel));
                } else if (grainRelativeTime < atk + dec + rel) {
                    const relProgress = (grainRelativeTime - (atk + dec)) / rel;
                    ampEnv = sustainLevel * (1.0 - relProgress);
                } else {
                    ampEnv = 0;
                }
            }

            // Remove jitter for first grain for tight timing
            const jitter = (i === 0) ? 0 : Math.random() * 0.005;
            
            if (ampEnv > 0.001) { 
                await this.playGrain(
                    track, 
                    time + grainRelativeTime + jitter, 
                    scheduleVisualDrawCallback, 
                    ampEnv, 
                    velocityLevel
                );
            }
        }
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
        this.loadedBuffers.clear();
        this.trackBufferCache = new WeakMap();
        this.pendingLoads.clear();
    }
    
    // Inline worklet code to bypass CSP restrictions
    // UPDATED: Now supports multi-output routing
    getWorkletCode() {
        return `
// BeatOS Granular Synthesis AudioWorklet Processor (Inline)
class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.MAX_VOICES = 64;
        this.voices = Array(this.MAX_VOICES).fill(null).map((_, id) => ({
            id, active: false, buffer: null, bufferLength: 0,
            position: 0, phase: 0, grainLength: 0, pitch: 1.0,
            velocity: 1.0, startFrame: 0, trackId: null
        }));
        this.trackBuffers = new Map();
        this.currentFrame = 0;
        this.totalGrainsTriggered = 0;
        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            switch(type) {
                case 'trigger': this.triggerGrain(data); break;
                case 'setBuffer': this.setBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'updateBuffer': this.updateBuffer(data.trackId, data.buffer, data.rmsMap); break;
                case 'stopAll': this.stopAllVoices(); break;
                case 'stopTrack': this.stopTrack(data.trackId); break;
                case 'getStats': this.sendStats(); break;
            }
        };
    }
    process(inputs, outputs, parameters) {
        // Clear all output channels first
        // 'outputs' is an array of output arrays (one per track)
        // Each output has 2 channels (stereo)
        for (let j = 0; j < outputs.length; j++) {
            const output = outputs[j];
            if (!output || output.length === 0) continue;
            for (let channel = 0; channel < output.length; channel++) {
                output[channel].fill(0);
            }
        }

        // Get frame count from first output (all should match)
        const frameCount = (outputs[0] && outputs[0][0]) ? outputs[0][0].length : 128;

        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active || !voice.buffer) continue;
            
            // ROUTING: Select the output corresponding to the trackId
            const trackOutput = outputs[voice.trackId];
            if (!trackOutput) continue;
            
            const channelCount = trackOutput.length;

            for (let i = 0; i < frameCount; i++) {
                if (voice.phase >= voice.grainLength) {
                    voice.active = false;
                    break;
                }
                const baseReadPos = voice.position * voice.bufferLength;
                const pitchOffset = voice.phase * voice.pitch;
                const readPos = baseReadPos + pitchOffset;
                const wrappedPos = readPos % voice.bufferLength;
                const sampleIndex = Math.floor(wrappedPos);
                const frac = wrappedPos - sampleIndex;
                const nextIndex = (sampleIndex + 1) % voice.bufferLength;
                const sample1 = voice.buffer[sampleIndex] || 0;
                const sample2 = voice.buffer[nextIndex] || 0;
                const sample = sample1 + (sample2 - sample1) * frac;
                const envPhase = voice.phase / voice.grainLength;
                
                // NEW: Trapezoidal Window for punchier transients
                // 10% Attack, 80% Sustain, 10% Release
                let envelope = 1.0;
                if (envPhase < 0.1) {
                    envelope = envPhase * 10.0;
                } else if (envPhase > 0.9) {
                    envelope = (1.0 - envPhase) * 10.0;
                }
                
                const outputSample = sample * envelope * voice.velocity;
                
                // Mix into specific track output (Channel 0 = Left, 1 = Right)
                trackOutput[0][i] += outputSample;
                if (channelCount > 1) { trackOutput[1][i] += outputSample; }
                
                voice.phase++;
            }
        }
        
        // Soft Clip Limiter on ALL active outputs
        const outputGain = 1.0; // Increased gain for louder output
        for (let j = 0; j < outputs.length; j++) {
            const output = outputs[j];
            if (!output) continue;
            
            for (let channel = 0; channel < output.length; channel++) {
                for (let i = 0; i < frameCount; i++) {
                    const sample = output[channel][i] * outputGain;
                    // Fast Tanh Approximation for Soft Clip
                    if (sample < -3) output[channel][i] = -1;
                    else if (sample > 3) output[channel][i] = 1;
                    else output[channel][i] = sample * (27 + sample * sample) / (27 + 9 * sample * sample);
                }
            }
        }
        
        this.currentFrame += frameCount;
        return true;
    }
    triggerGrain(data) {
        const { trackId, position = 0.5, grainSize = 0.1, pitch = 1.0, velocity = 1.0, spray = 0.0, useRmsMap = true } = data;
        const trackData = this.trackBuffers.get(trackId);
        if (!trackData || !trackData.buffer) return;
        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            voice = this.voices.reduce((oldest, v) => v.startFrame < oldest.startFrame ? v : oldest);
        }
        let finalPosition = position;
        if (spray > 0) {
            finalPosition += (Math.random() * 2 - 1) * spray;
            finalPosition = Math.max(0, Math.min(1, finalPosition));
        }
        if (useRmsMap && trackData.rmsMap && trackData.rmsMap.length > 0) {
            finalPosition = this.findActivePosition(finalPosition, trackData.rmsMap);
        }
        voice.active = true;
        voice.buffer = trackData.buffer;
        voice.bufferLength = trackData.buffer.length;
        voice.position = finalPosition;
        voice.phase = 0;
        voice.grainLength = Math.max(128, Math.floor(grainSize * sampleRate));
        voice.pitch = Math.max(0.05, Math.min(8.0, pitch)); // Updated Limits
        voice.velocity = Math.max(0, Math.min(2.0, velocity));
        voice.startFrame = this.currentFrame;
        voice.trackId = trackId;
        this.totalGrainsTriggered++;
    }
    findActivePosition(requestedPos, rmsMap) {
        if (!rmsMap || rmsMap.length === 0) return requestedPos;
        const mapIdx = Math.floor(requestedPos * (rmsMap.length - 1));
        if (rmsMap[mapIdx]) return requestedPos;
        for (let i = 1; i < 50; i++) {
            const forwardIdx = Math.min(mapIdx + i, rmsMap.length - 1);
            if (rmsMap[forwardIdx]) return forwardIdx / (rmsMap.length - 1);
            const backwardIdx = Math.max(mapIdx - i, 0);
            if (rmsMap[backwardIdx]) return backwardIdx / (rmsMap.length - 1);
        }
        return requestedPos;
    }
    setBuffer(trackId, buffer, rmsMap = null) {
        let processedRmsMap = null;
        if (rmsMap && rmsMap.length > 0) {
            processedRmsMap = rmsMap.map(val => val > 0.01);
        }
        this.trackBuffers.set(trackId, { buffer: buffer, rmsMap: processedRmsMap });
        this.port.postMessage({ type: 'bufferLoaded', trackId, bufferLength: buffer.length, hasRmsMap: !!processedRmsMap });
    }
    updateBuffer(trackId, buffer, rmsMap = null) {
        this.setBuffer(trackId, buffer, rmsMap);
    }
    stopAllVoices() {
        for (let v = 0; v < this.voices.length; v++) {
            this.voices[v].active = false;
        }
    }
    stopTrack(trackId) {
        for (let v = 0; v < this.voices.length; v++) {
            if (this.voices[v].trackId === trackId) {
                this.voices[v].active = false;
            }
        }
    }
    sendStats() {
        const activeVoices = this.voices.filter(v => v.active).length;
        const loadedBuffers = this.trackBuffers.size;
        this.port.postMessage({
            type: 'stats',
            data: {
                activeVoices, maxVoices: this.MAX_VOICES, loadedBuffers,
                totalGrainsTriggered: this.totalGrainsTriggered,
                currentFrame: this.currentFrame
            }
        });
    }
}
registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);
        `;
    }
}