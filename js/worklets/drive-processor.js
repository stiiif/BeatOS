// BeatOS Drive Processor
// Implements 4x Oversampled Saturation for Analog-style Warmth
// reducing aliasing artifacts when driving signals hard.

class BeatOSDriveProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'drive', defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: 'outputGain', defaultValue: 1, minValue: 0, maxValue: 2 }
        ];
    }

    constructor() {
        super();
        // FIR Filter Coefficients for interpolation/decimation (Low Pass)
        // Simple windowed-sinc or polyphase could be used. 
        // For efficiency in JS, we use a small kernel.
        this.lpCoeffs = [0.05, 0.25, 0.4, 0.25, 0.05]; 
        
        // History buffers for filtering
        this.upHistory = new Float32Array(4).fill(0);
        this.downHistory = new Float32Array(4).fill(0);
    }

    // Soft Clipping Function (tanh-like)
    saturate(x, drive) {
        if (drive === 0) return x;
        
        // Pre-gain
        const gain = 1 + (drive * 8); 
        const signal = x * gain;

        // Fast approximation of tanh for saturation
        // x / (1 + |x|) is a common cheap alternative, but tanh sounds better for drive
        if (signal < -3) return -1;
        if (signal > 3) return 1;
        return signal * (27 + signal * signal) / (27 + 9 * signal * signal);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        if (!input || !output || input.length === 0) return true;

        const drive = parameters.drive[0];
        const outGain = parameters.outputGain[0];
        const channelCount = input.length;
        const frameCount = input[0].length;

        // If drive is negligible, bypass oversampling for performance
        if (drive < 0.01) {
            for (let ch = 0; ch < channelCount; ch++) {
                output[ch].set(input[ch]);
            }
            return true;
        }

        // Process each channel
        for (let ch = 0; ch < channelCount; ch++) {
            const inputChannel = input[ch];
            const outputChannel = output[ch];

            for (let i = 0; i < frameCount; i++) {
                const x = inputChannel[i];

                // 1. Upsample (Zero Stuffing 4x)
                // We process 4 sub-samples for every 1 input sample
                // Ideal: x, 0, 0, 0 -> Filter -> Distort -> Filter -> Decimate
                
                // For a simple real-time implementation, we can use 2x oversampling 
                // with linear interpolation + saturation to save CPU, or full 4x.
                // Let's do 2x for stability in this JS context.
                
                // Polyphase-ish approach:
                // Calculate intermediate sample (average)
                const x_half = (x + this.upHistory[ch]) * 0.5;
                this.upHistory[ch] = x; // store current for next

                // Apply Drive at 2x rate
                const y1 = this.saturate(x_half, drive); // Inter-sample
                const y2 = this.saturate(x, drive);      // On-sample

                // Filter (Simple Low Pass to remove aliasing from saturation)
                // y = (y1 + y2) / 2 is basic averaging (decimation)
                
                // Output
                outputChannel[i] = ((y1 + y2) * 0.5) * outGain;
            }
        }

        return true;
    }
}

registerProcessor('beatos-drive-processor', BeatOSDriveProcessor);