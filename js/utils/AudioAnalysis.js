/**
 * AudioAnalysis - Pure utility functions for processing AudioBuffers.
 * Decoupled from the AudioContext state.
 */
export class AudioAnalysis {

    /**
     * Analyze buffer for RMS amplitude visualization
     * @param {AudioBuffer} buffer 
     * @returns {boolean[]} Array of booleans indicating presence of signal > threshold
     */
    static analyzeBuffer(buffer) {
        if (!buffer) return [];
        const data = buffer.getChannelData(0);
        const chunkSize = Math.floor(data.length / 100);
        const map = [];

        for (let i = 0; i < 100; i++) {
            let sum = 0;
            const start = i * chunkSize;
            // Guard against out of bounds if length isn't perfectly divisible
            const limit = Math.min(start + chunkSize, data.length);
            
            for (let j = start; j < limit; j++) {
                const s = data[j];
                sum += s * s;
            }
            const rms = Math.sqrt(sum / chunkSize);
            map.push(rms > 0.01);
        }
        return map;
    }

    /**
     * Smart trim using threshold and transient detection logic
     * @param {AudioContext} audioCtx - Context needed to create new buffer
     * @param {AudioBuffer} buffer - Source buffer
     * @param {number} staticThreshold - Noise floor threshold
     * @param {boolean} useTransientDetection - Whether to use relative peak detection
     * @returns {AudioBuffer} Trimmed buffer
     */
    static trimBuffer(audioCtx, buffer, staticThreshold = 0.002, useTransientDetection = true) {
        if (!buffer || !audioCtx) return buffer;

        const numChannels = buffer.numberOfChannels;
        const len = buffer.length;
        let startIndex = len; // Default to end (if silence)

        if (useTransientDetection) {
            // Create a temporary mono array for analysis
            const mono = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                let sum = 0;
                for (let c = 0; c < numChannels; c++) {
                    sum += buffer.getChannelData(c)[i];
                }
                mono[i] = sum / numChannels;
            }

            // Find max amplitude to normalize threshold logic
            let maxAmp = 0;
            for (let i = 0; i < len; i++) {
                const abs = Math.abs(mono[i]);
                if (abs > maxAmp) maxAmp = abs;
            }

            // If silent, return original
            if (maxAmp < 0.001) return buffer;

            // Set threshold relative to peak (e.g., 5% of peak)
            // But ensure it's not lower than the static noise floor threshold
            const relativeThreshold = maxAmp * 0.05;
            const finalThreshold = Math.max(staticThreshold, relativeThreshold);

            // Scan
            for (let i = 0; i < len; i++) {
                if (Math.abs(mono[i]) > finalThreshold) {
                    // Backtrack slightly to catch the attack ramp-up (e.g. 2ms)
                    const backtrackSamples = Math.floor(0.002 * buffer.sampleRate);
                    startIndex = Math.max(0, i - backtrackSamples);
                    break;
                }
            }
        } else {
            // Original static threshold logic
            for (let c = 0; c < numChannels; c++) {
                const data = buffer.getChannelData(c);
                for (let i = 0; i < len; i++) {
                    if (Math.abs(data[i]) > staticThreshold) {
                        if (i < startIndex) startIndex = i;
                        break;
                    }
                }
            }
        }

        // Check if trimming is needed
        if (startIndex >= len || startIndex === 0) return buffer;

        // Create new shorter buffer
        const newLen = len - startIndex;
        const newBuffer = audioCtx.createBuffer(numChannels, newLen, buffer.sampleRate);

        for (let c = 0; c < numChannels; c++) {
            const oldData = buffer.getChannelData(c);
            const newData = newBuffer.getChannelData(c);
            for (let i = 0; i < newLen; i++) {
                newData[i] = oldData[i + startIndex];
            }
        }

        console.log(`[AudioAnalysis] Trimmed ${(startIndex / buffer.sampleRate).toFixed(4)}s start silence.`);
        return newBuffer;
    }
}