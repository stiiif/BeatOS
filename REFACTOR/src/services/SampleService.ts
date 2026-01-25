import { audioContext } from '../core/AudioContext';

export class SampleService {
    
    /**
     * Loads and decodes an audio file (File or Blob)
     */
    static async loadFromFile(file: File | Blob): Promise<{ buffer: AudioBuffer; name: string }> {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = audioContext.getContext();
        let audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        // Auto-trim silence by default using smart detection
        audioBuffer = this.trimBuffer(audioBuffer, 0.005, true);

        return { 
            buffer: audioBuffer, 
            name: (file as File).name || 'Sample'
        };
    }

    /**
     * Loads a sample from a URL (e.g. Freesound)
     */
    static async loadFromUrl(url: string): Promise<AudioBuffer> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch sample: ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const ctx = audioContext.getContext();
        let audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        // Trim for cleaner playback
        audioBuffer = this.trimBuffer(audioBuffer, 0.01, true); // Higher threshold for web samples
        
        return audioBuffer;
    }

    /**
     * Smart Silence Trimming using Transient Detection
     * Ported strictly from AudioEngine.js logic
     */
    static trimBuffer(buffer: AudioBuffer, staticThreshold = 0.002, useTransientDetection = true): AudioBuffer {
        if (!buffer) return buffer;
        
        const numChannels = buffer.numberOfChannels;
        const len = buffer.length;
        let startIndex = len; // Default to end (if silence)

        if (useTransientDetection) {
            // 1. Create mono sum for analysis
            const mono = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                let sum = 0;
                for (let c = 0; c < numChannels; c++) {
                    sum += buffer.getChannelData(c)[i];
                }
                mono[i] = sum / numChannels;
            }

            // 2. Find max amplitude
            let maxAmp = 0;
            for (let i = 0; i < len; i++) {
                const abs = Math.abs(mono[i]);
                if (abs > maxAmp) maxAmp = abs;
            }

            // If silent, return original
            if (maxAmp < 0.001) return buffer;

            // 3. Dynamic Thresholding
            // 5% of peak is a safe "start" for a drum hit, but ensure it's above static noise floor
            const relativeThreshold = maxAmp * 0.05; 
            const finalThreshold = Math.max(staticThreshold, relativeThreshold);

            // 4. Scan for transient
            for (let i = 0; i < len; i++) {
                if (Math.abs(mono[i]) > finalThreshold) {
                    // Backtrack slightly to catch attack ramp (e.g. 2ms)
                    const backtrackSamples = Math.floor(0.002 * buffer.sampleRate);
                    startIndex = Math.max(0, i - backtrackSamples);
                    break;
                }
            }
        } else {
            // Standard static threshold scan
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

        // Check if trimming is actually needed
        if (startIndex >= len || startIndex === 0) return buffer;

        // Create trimmed buffer
        const ctx = audioContext.getContext();
        const newLen = len - startIndex;
        const newBuffer = ctx.createBuffer(numChannels, newLen, buffer.sampleRate);

        for (let c = 0; c < numChannels; c++) {
            const oldData = buffer.getChannelData(c);
            const newData = newBuffer.getChannelData(c);
            // Copy data shifted
            for (let i = 0; i < newLen; i++) {
                newData[i] = oldData[i + startIndex];
            }
        }

        // console.log(`[SampleService] Trimmed ${(startIndex / buffer.sampleRate).toFixed(4)}s`);
        return newBuffer;
    }
}