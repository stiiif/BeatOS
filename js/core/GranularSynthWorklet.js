import { MAX_TRACKS } from '../utils/constants.js';
import { MEMORY_LAYOUT } from './SharedMemory.js'; 

export class GranularSynthWorklet {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.workletNode = null;
        this.isInitialized = false;
        this.pendingBufferLoads = new Map();
    }

    async init() {
        if (this.isInitialized) return;
        
        const ctx = this.audioEngine.getContext();
        const memory = this.audioEngine.getMemory();
        
        console.log('[GranularSynth] Initializing Worklet...');
        
        try {
            await ctx.audioWorklet.addModule('js/worklets/granular-processor.js');
            
            const outputChannelCounts = new Array(MAX_TRACKS + 2).fill(2);
            
            this.workletNode = new AudioWorkletNode(ctx, 'beatos-granular-processor', {
                numberOfInputs: 0,
                numberOfOutputs: MAX_TRACKS + 2,
                outputChannelCount: outputChannelCounts,
                processorOptions: {} 
            });
            
            this.workletNode.port.postMessage({
                type: 'initMemory',
                buffers: memory.getBuffers()
            });
            
            this.workletNode.port.onmessage = (e) => {
                const { type, trackId } = e.data;
                if (type === 'bufferLoaded') {
                    if (this.pendingBufferLoads.has(trackId)) {
                        this.pendingBufferLoads.get(trackId)();
                        this.pendingBufferLoads.delete(trackId);
                    }
                }
            };
            
            this.audioEngine.connectWorkletOutputs(this.workletNode);
            
            this.isInitialized = true;
            console.log('[GranularSynth] Worklet Ready & Connected.');
            
        } catch (e) {
            console.error('[GranularSynth] Init Failed:', e);
            throw e;
        }
    }
    
    async ensureBufferLoaded(track) {
        if (!this.isInitialized) await this.init();
        if (!track.buffer) return;
        
        const trackId = track.id;
        
        return new Promise((resolve) => {
            this.pendingBufferLoads.set(trackId, resolve);
            
            const channelData = track.buffer.getChannelData(0); 
            
            this.workletNode.port.postMessage({
                type: 'setBuffer',
                trackId: trackId,
                buffer: channelData
            });
            
            setTimeout(() => {
                if (this.pendingBufferLoads.has(trackId)) {
                    this.pendingBufferLoads.delete(trackId);
                    resolve();
                }
            }, 500);
        });
    }
    
    getActiveGrainCount() {
        if (!this.audioEngine || !this.audioEngine.getMemory()) return 0;
        
        const buffer = this.audioEngine.getMemory().getBuffers().control;
        
        // Safety check for SAB before using Atomics
        if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
            const view = new Int32Array(buffer);
            return Atomics.load(view, MEMORY_LAYOUT.IDX_ACTIVE_VOICES);
        } else {
            // Fallback for ArrayBuffer (can't read atomic updates from thread)
            return 0; 
        }
    }

    setMaxGrains(val) {
        // No-op
    }
    
    // --- Global Controls ---
    
    play() {
        if (!this.isInitialized) return;
        
        const buffer = this.audioEngine.getMemory().getBuffers().control;
        
        // 1. Try Shared Memory Update
        if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
            const view = new Int32Array(buffer);
            Atomics.store(view, MEMORY_LAYOUT.IDX_STATE, 1);
        }
        
        // 2. ALWAYS Send Message as Fallback (Fixes "Play button broken" on non-SAB systems)
        this.workletNode.port.postMessage({ type: 'play' });
    }
    
    stop() {
        if (!this.isInitialized) return;

        const buffer = this.audioEngine.getMemory().getBuffers().control;
        
        if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
            const view = new Int32Array(buffer);
            Atomics.store(view, MEMORY_LAYOUT.IDX_STATE, 0);
        }
        
        this.workletNode.port.postMessage({ type: 'stop' });
    }
    
    setBPM(bpm) {
        if (!this.isInitialized) return;

        const buffer = this.audioEngine.getMemory().getBuffers().control;
        
        if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
            const view = new Int32Array(buffer);
            view[MEMORY_LAYOUT.IDX_BPM] = bpm;
        }
        
        this.workletNode.port.postMessage({ type: 'setBPM', value: bpm });
    }
    
    scheduleNote(track, time, callback, velocity) {
        // No-op
    }
}