class BeatOSGranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = null; // Float32Array containing the audio sample
        this.grains = [];   // Array of active grain objects
        this.sampleRate = 44100; // Will be updated by the global scope
        this.maxGrains = 64; // Polyphony limit to prevent CPU overload
    }

    static get parameterDescriptors() {
        return [
            /**
             * Offset: Sets the playback start position within the sample (0% to 100%).
             * Determines which part of the audio file is used as the source.
             */
            { name: 'offset', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },

            /**
             * Duration: The length of time a single grain plays (in seconds).
             * Short = percussive/glitchy; Long = smooth/atmospheric.
             */
            { name: 'duration', defaultValue: 0.1, minValue: 0.01, maxValue: 1, automationRate: 'k-rate' },

            /**
             * Density: Controls the frequency at which new grains are spawned (Hz).
             * Low values = distinct pulses; High values = continuous textures.
             */
            { name: 'density', defaultValue: 10, minValue: 0.1, maxValue: 100, automationRate: 'k-rate' },

            /**
             * Spray: Adds randomness to the Offset position for each new grain.
             * Creates a "cloud" texture by grabbing audio from a wider area.
             */
            { name: 'spray', defaultValue: 0, minValue: 0, maxValue: 0.5, automationRate: 'k-rate' },

            /**
             * Pitch: Adjusts the playback speed of the sample within the grain (1.0 = normal).
             * Changes pitch without affecting grain duration.
             */
            { name: 'pitch', defaultValue: 1, minValue: 0.1, maxValue: 4, automationRate: 'k-rate' },

            /**
             * Amp: The master gain (volume) for the track.
             */
            { name: 'amp', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },

            /**
             * Attack: The fade-in time for each individual grain.
             * Softens the transient/click at the start of the grain.
             */
            { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 0.5, automationRate: 'k-rate' },

            /**
             * Release: The fade-out time for each individual grain.
             * Allows grains to ring out and mix smoothly.
             */
            { name: 'release', defaultValue: 0.01, minValue: 0.001, maxValue: 0.5, automationRate: 'k-rate' },

            /**
             * Pan: The stereo placement of the grains (-1 Left to +1 Right).
             */
            { name: 'pan', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' },

            /**
             * Reverb Send: The amount of signal sent to the global Convolution Reverb.
             */
            { name: 'reverbSend', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
        ];
    }

    process(inputs, outputs, parameters) {
        // 1. Setup Inputs/Outputs
        const output = outputs[0];
        const channelCount = output.length; // Usually 2 (Stereo)
        
        // Handle message port (buffer loading)
        this.port.onmessage = (event) => {
            if (event.data.type === 'load-buffer') {
                this.buffer = event.data.buffer;
            }
        };

        if (!this.buffer) return true;

        // 2. Fetch Parameters (k-rate unless noted)
        const offset = parameters.offset[0];
        const duration = parameters.duration[0];
        const density = parameters.density[0];
        const spray = parameters.spray[0];
        const pitch = parameters.pitch[0];
        const attack = parameters.attack[0];
        const release = parameters.release[0];
        const reverbSend = parameters.reverbSend[0];
        
        // Audio Params (Arrays)
        const ampData = parameters.amp; 
        const panData = parameters.pan;

        // 3. Spawn New Grains
        // Probability of spawning per sample = density / sampleRate
        // For a block of 128 samples, we check if we should spawn.
        // Simplified: Check once per block or distribute? 
        // Better: Use a counter to ensure exact density timing, but random is more "granular".
        // Current: Stochastic approach (Random Cloud)
        const spawnProbability = (density / this.sampleRate) * 128;
        if (Math.random() < spawnProbability) {
             this.spawnGrain(offset, duration, spray, pitch, attack, release);
        }

        // 4. Render & Mix Grains
        // We mix all grains into a temporary mono buffer first
        const mixBuffer = new Float32Array(128);

        for (let i = this.grains.length - 1; i >= 0; i--) {
            const grain = this.grains[i];
            
            // Render the grain's contribution for this block
            this.renderGrainToBuffer(grain, mixBuffer, 128);

            // Check if grain is dead
            if (grain.age >= grain.totalSamples) {
                this.grains.splice(i, 1);
            }
        }

        // 5. Apply Effects & Write to Output
        for (let i = 0; i < 128; i++) {
            const monoSample = mixBuffer[i];
            
            // Get a-rate or k-rate values
            const currentAmp = ampData.length > 1 ? ampData[i] : ampData[0];
            const currentPan = panData.length > 1 ? panData[i] : panData[0];

            // Apply Amp
            const gainedSample = monoSample * currentAmp;

            // Apply Pan (Equal Power)
            // Pan range: -1 (Left) to 1 (Right)
            // Normalize to 0..1 for math: (pan + 1) / 2
            const normPan = (currentPan + 1) / 2;
            
            // Left: cos(p * PI/2), Right: sin(p * PI/2) standard constant power
            // Simplified Linear for speed: L = (1-p), R = p (approx 3dB dip in center)
            // Let's use SQRT for better power curve:
            // const gainL = Math.sqrt(1 - normPan);
            // const gainR = Math.sqrt(normPan);
            // Even Faster: Cos/Sin Lookups or just standard Linear (it's granular, absolute precision isn't key)
            const gainL = Math.cos(normPan * 0.5 * Math.PI);
            const gainR = Math.sin(normPan * 0.5 * Math.PI);

            if (channelCount > 0) output[0][i] = gainedSample * gainL;
            if (channelCount > 1) output[1][i] = gainedSample * gainR;
        }

        return true;
    }

    spawnGrain(offset, duration, spray, pitch, attack, release) {
        if (this.grains.length >= this.maxGrains) return;

        // Calculate start position with spray (randomization)
        // spray is 0..1. We map it to a +/- range relative to buffer length
        const randomSpray = (Math.random() * 2 - 1) * spray; 
        
        // Final position (0..1)
        let startPos = offset + randomSpray;
        
        // Clamp 0..1
        if (startPos < 0) startPos = 0;
        if (startPos > 1) startPos = 1;

        // Convert to samples
        const startSample = Math.floor(startPos * (this.buffer.length - 1));
        
        const totalSamples = Math.floor(duration * this.sampleRate);
        const attackSamples = Math.floor(attack * this.sampleRate);
        const releaseSamples = Math.floor(release * this.sampleRate);

        this.grains.push({
            startSample: startSample,
            totalSamples: totalSamples,
            age: 0,
            pitch: pitch,
            attackSamples: attackSamples,
            releaseSamples: releaseSamples
        });
    }

    renderGrainToBuffer(grain, mixBuffer, blockSize) {
        const buffer = this.buffer;
        
        for (let i = 0; i < blockSize; i++) {
            // Stop if grain is finished
            if (grain.age >= grain.totalSamples) break;

            // 1. Calculate Envelope (Amplitude)
            let env = 1.0;
            if (grain.age < grain.attackSamples) {
                // Fade In
                env = grain.age / grain.attackSamples;
            } else if (grain.age > (grain.totalSamples - grain.releaseSamples)) {
                // Fade Out
                const samplesRemaining = grain.totalSamples - grain.age;
                env = samplesRemaining / grain.releaseSamples;
            }

            // 2. Calculate Pitch (Playback Position)
            // Position = Start + (Age * Pitch)
            const playPos = grain.startSample + (grain.age * grain.pitch);
            
            // Loop or Clamp? Granular usually clamps or zeros if out of bounds.
            if (playPos >= buffer.length - 1) {
                grain.age++; 
                continue; 
            }

            // 3. Linear Interpolation
            const index = Math.floor(playPos);
            const frac = playPos - index;
            
            const s1 = buffer[index];
            const s2 = buffer[index + 1]; // Safe due to boundary check above
            
            const sample = s1 + (s2 - s1) * frac;

            // 4. Mix into buffer
            mixBuffer[i] += sample * env;

            // Increment Age
            grain.age++;
        }
    }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);