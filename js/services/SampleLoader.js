// js/services/SampleLoader.js
export class SampleLoader {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.granularSynth = null;
    }

    setGranularSynth(synth) {
        this.granularSynth = synth;
    }

    async loadSampleFromUrl(url, track) {
        if (!this.audioEngine) throw new Error("AudioEngine not initialized");
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch sample: ${response.statusText}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const audioCtx = this.audioEngine.getContext();
            
            if (!audioCtx) throw new Error("AudioContext not available");

            let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            // ✅ FIX: Always switch to granular when loading a sample
            track.type = 'granular';
            
            // Update Track with new sample data
            track.customSample = {
                name: "Freesound Sample",
                buffer: audioBuffer,
                duration: audioBuffer.duration
            };
            track.buffer = audioBuffer;
            
            // Skip RMS analysis to prevent freezes
            track.rmsMap = [];
            
            // ✅ CRITICAL: Reload buffer in AudioWorklet
            if (this.granularSynth && this.granularSynth.isInitialized) {
                console.log(`[SampleLoader] Switching track ${track.id} to granular & reloading buffer`);
                
                // Force worklet to forget old buffer
                this.granularSynth.loadedBuffers.delete(track.id);
                
                // Load new buffer
                await this.granularSynth.ensureBufferLoaded(track);
            }
            
            return audioBuffer;
        } catch (error) {
            console.error("SampleLoader Error:", error);
            throw error;
        }
    }
}