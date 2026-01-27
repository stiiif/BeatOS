// Sample Loader Service
export class SampleLoader {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
    }

    async loadSampleFromUrl(url, track) {
        console.log('[LOADER-1] loadSampleFromUrl: ENTRY');
        console.log('[LOADER-1] URL:', url);
        console.log('[LOADER-1] Track ID:', track.id);
        
        if (!this.audioEngine) {
            console.error('[LOADER-1] audioEngine is NULL!');
            throw new Error("AudioEngine not initialized");
        }
        
        try {
            console.log('[LOADER-2] Starting fetch...');
            console.log('[LOADER-2] Time:', new Date().toISOString());
            
            const response = await fetch(url);
            
            console.log('[LOADER-3] Fetch complete');
            console.log('[LOADER-3] Status:', response.status);
            console.log('[LOADER-3] Time:', new Date().toISOString());
            
            if (!response.ok) {
                console.error('[LOADER-3] Fetch failed:', response.statusText);
                throw new Error(`Failed to fetch sample: ${response.statusText}`);
            }
            
            console.log('[LOADER-4] Converting to arrayBuffer...');
            console.log('[LOADER-4] Time:', new Date().toISOString());
            
            const arrayBuffer = await response.arrayBuffer();
            
            console.log('[LOADER-5] arrayBuffer complete');
            console.log('[LOADER-5] Size:', arrayBuffer.byteLength, 'bytes');
            console.log('[LOADER-5] Time:', new Date().toISOString());
            
            const audioCtx = this.audioEngine.getContext();
            
            if (!audioCtx) {
                console.error('[LOADER-5] AudioContext is NULL!');
                throw new Error("AudioContext not available");
            }
            
            console.log('[LOADER-6] AudioContext state:', audioCtx.state);
            console.log('[LOADER-6] ⚠️⚠️⚠️ ABOUT TO CALL decodeAudioData - THIS IS THE FREEZE POINT! ⚠️⚠️⚠️');
            console.log('[LOADER-6] Time BEFORE decode:', new Date().toISOString());

            let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            console.log('[LOADER-7] ✅✅✅ decodeAudioData COMPLETE - IT WORKED! ✅✅✅');
            console.log('[LOADER-7] Time AFTER decode:', new Date().toISOString());
            console.log('[LOADER-7] Duration:', audioBuffer.duration, 'seconds');
            console.log('[LOADER-7] Channels:', audioBuffer.numberOfChannels);
            console.log('[LOADER-7] Sample rate:', audioBuffer.sampleRate);
            
            // Auto-Trim Silence if method exists
            if (this.audioEngine.trimBuffer) {
                console.log('[LOADER-8] Trimming silence...');
                audioBuffer = this.audioEngine.trimBuffer(audioBuffer, 0.01);
                console.log('[LOADER-8] Trimming complete');
            }
            
            console.log('[LOADER-9] Updating track object...');
            // Update Track with new sample data
            track.customSample = {
                name: "Freesound Sample",
                buffer: audioBuffer,
                duration: audioBuffer.duration
            };
            track.buffer = audioBuffer;
            
            console.log('[LOADER-10] Analyzing buffer...');
            track.rmsMap = this.audioEngine.analyzeBuffer(audioBuffer);
            console.log('[LOADER-10] Analysis complete');
            
            // Ensure track is set to granular/sample mode
            track.type = 'granular';
            
            console.log('[LOADER-11] ✅ loadSampleFromUrl: SUCCESS');
            return audioBuffer;
        } catch (error) {
            console.error('[LOADER-ERROR] Exception:', error);
            console.error('[LOADER-ERROR] Stack:', error.stack);
            throw error;
        }
    }
}
