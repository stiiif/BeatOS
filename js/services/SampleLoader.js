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
            
            // Auto-Trim Silence if method exists (from AudioEngine update)
            if (this.audioEngine.trimBuffer) {
                // Use a higher threshold (0.01) to catch background noise/hiss
                // common in Freesound samples, which might otherwise prevent trimming.
                audioBuffer = this.audioEngine.trimBuffer(audioBuffer, 0.01);
            }
            
            // Update Track with new sample data
            track.customSample = {
                name: "Freesound Sample", // Should be updated with actual name from caller
                buffer: audioBuffer,
                duration: audioBuffer.duration
            };
            track.buffer = audioBuffer;
            track.rmsMap = this.audioEngine.analyzeBuffer(audioBuffer);
            
            // Ensure track is set to granular/sample mode
            track.type = 'granular';
            
            return audioBuffer;
        } catch (error) {
            console.error("SampleLoader Error:", error);
            throw error;
        }
    }
}