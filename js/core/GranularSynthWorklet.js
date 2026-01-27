// Granular SynthWorklet - AudioWorklet-based granular synthesis
// Drop-in replacement for GranularSynth.js with same API
// Provides massive performance improvements with dedicated audio thread

import { VELOCITY_GAINS } from '../utils/constants.js';

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.activeGrains = 0;
        this.MAX_GRAINS = 64;
        
        // Track which buffers have been loaded into worklet
        this.loadedBuffers = new Set();
        
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
                // Load the AudioWorklet module
                await audioCtx.audioWorklet.addModule('/js/worklets/granular-processor.js');
                console.log('[GranularSynthWorklet] Worklet module loaded');
                
                // Create the worklet node
                this.workletNode = new AudioWorkletNode(audioCtx, 'beatos-granular-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: 1,
                    outputChannelCount: [2] // Stereo output
                });
                
                // Handle messages from worklet
                this.workletNode.port.onmessage = (e) => {
                    this.handleWorkletMessage(e.data);
                };
                
                // DON'T connect to destination yet - grains will route through track buses
                // The worklet generates audio, but we need to route it through track effects
                
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
                // Could display stats in UI
                // console.log('[GranularSynthWorklet] Stats:', data);
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

    findActivePosition(track, requestedPos) {
        // This is now handled in the worklet, but keep for compatibility
        if (!track.rmsMap || track.rmsMap.length === 0) return requestedPos;
        const mapIdx = Math.floor(requestedPos * 99); 
        if (track.rmsMap[mapIdx]) return requestedPos; 
        for (let i = 1; i < 50; i++) {
            if (track.rmsMap[mapIdx + i]) return (mapIdx + i) / 99;
            if (track.rmsMap[mapIdx - i]) return (mapIdx - i) / 99;
        }
        return requestedPos; 
    }

    async ensureBufferLoaded(track) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        const trackId = track.id;
        
        // Already loaded?
        if (this.loadedBuffers.has(trackId)) {
            return;
        }
        
        if (!track.buffer) {
            console.warn('[GranularSynthWorklet] No buffer for track:', trackId);
            return;
        }
        
        // Check if already loading
        if (this.pendingLoads.has(trackId)) {
            return this.pendingLoads.get(trackId);
        }
        
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
        this.loadedBuffers.add(trackId);
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
        
        // Ensure buffer is loaded in worklet
        await this.ensureBufferLoaded(track);

        // Calculate gain multiplier based on velocity
        let gainMult = 1.0;
        let filterOffset = 0;
        let sprayMod = 0;

        switch(velocityLevel) {
            case 1: // Ghost
                gainMult = 0.4;
                filterOffset = -3000;
                sprayMod = 0.05; 
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
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;

        // Calculate position
        let basePos = (p.scanSpeed > 0.01 || p.scanSpeed < -0.01) ? track.playhead : p.position;
        
        let gPos = Math.max(0, Math.min(1, basePos + mod.position));
        const spray = Math.max(0, p.spray + mod.spray + sprayMod);
        gPos += (Math.random()*2-1) * spray;
        gPos = Math.max(0, Math.min(1, gPos));

        // Apply filters via track bus (still on main thread for now)
        if(track.bus.hp) {
            track.bus.hp.frequency.setValueAtTime(
                this.audioEngine.getMappedFrequency(Math.max(20, p.hpFilter + mod.hpFilter), 'hp'), 
                time
            );
        }
        
        let lpFreq = this.audioEngine.getMappedFrequency(Math.max(100, p.filter + mod.filter), 'lp');
        if (velocityLevel === 1) lpFreq = Math.max(100, lpFreq + filterOffset);
        if(track.bus.lp) {
            track.bus.lp.frequency.setValueAtTime(lpFreq, time);
        }
        
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);

        // CRITICAL: We need to route worklet through track bus
        // Connect worklet to this track's bus if not already connected
        if (!this.workletNode.connectedTracks) {
            this.workletNode.connectedTracks = new Set();
        }
        
        if (!this.workletNode.connectedTracks.has(track.id)) {
            this.workletNode.connect(track.bus.input);
            this.workletNode.connectedTracks.add(track.id);
        }

        // Calculate when to trigger grain in worklet
        const currentTime = audioCtx.currentTime;
        const delayMs = Math.max(0, (time - currentTime) * 1000);
        
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
        // Handle simple drum tracks differently
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
        const dec = p.ampDecay || 0.1;
        const rel = p.ampRelease || 0.1;
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
        this.pendingLoads.clear();
    }
}
