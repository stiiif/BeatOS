// Sample Loader Service
export class SampleLoader {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
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
            
            // Skip trimming - preserves full sample
            // Auto-Trim removed to prevent potential issues
            
            // Update Track with new sample data
            track.customSample = {
                name: "Freesound Sample",
                buffer: audioBuffer,
                duration: audioBuffer.duration
            };
            track.buffer = audioBuffer;
            
            // Skip RMS analysis - it was causing 15-37 second freezes!
            // GranularSynth handles empty rmsMap gracefully
            track.rmsMap = [];
            
            return audioBuffer;
        } catch (error) {
            console.error("SampleLoader Error:", error);
            throw error;
        }
    }
}
