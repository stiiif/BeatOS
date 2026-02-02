// BeatOS Buffer Analysis Worker
// Handles heavy RMS calculation off the main thread to prevent UI freezing.

self.onmessage = function(e) {
    const { command, audioData, trackId } = e.data;

    if (command === 'analyze') {
        try {
            const rmsMap = analyzeBufferData(audioData);
            
            // Send back result
            self.postMessage({
                command: 'result',
                rmsMap: rmsMap,
                trackId: trackId
            });
        } catch (error) {
            console.error('[Analysis Worker] Error analyzing buffer:', error);
            self.postMessage({
                command: 'error',
                error: error.message,
                trackId: trackId
            });
        }
    }
};

/**
 * Calculates RMS map for waveform visualization
 * @param {Float32Array} data - Raw audio channel data
 * @returns {boolean[]} - Array of 100 booleans indicating active regions
 */
function analyzeBufferData(data) {
    if (!data || data.length === 0) return [];

    const chunkSize = Math.floor(data.length / 100); 
    const map = [];

    for (let i = 0; i < 100; i++) {
        let sum = 0;
        const start = i * chunkSize;
        
        // Safety check for bounds
        const end = Math.min(start + chunkSize, data.length);
        
        for (let j = start; j < end; j++) {
            const s = data[j];
            sum += s * s;
        }
        
        const rms = Math.sqrt(sum / (end - start || 1));
        map.push(rms > 0.01); 
    }
    
    return map;
}