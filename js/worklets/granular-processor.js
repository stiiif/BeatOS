/**
 * Granular Processor (AudioWorklet)
 * * Handles the generation of grains in the audio thread.
 * UPDATED: Now supports sample-accurate scheduling via an event queue AND stop logic.
 * DEBUG MODE: Console logs added to troubleshoot timing.
 */

class GranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // Configuration
        this.maxGrains = 64;
        this.grains = [];
        
        // Sample-Accurate Timing Queue
        // We buffer events here and play them at the exact calculated sample
        this.eventQueue = [];
        
        // Initialize grains
        for (let i = 0; i < this.maxGrains; i++) {
            this.grains.push({
                active: false,
                position: 0,
                increment: 1,
                windowSize: 0,
                envelope: 0,
                volume: 0,
                buffer: null,
                isReverse: false,
                startOffset: 0
            });
        }

        this.port.onmessage = (event) => {
            if (event.data.type === 'buffer') {
                this.buffer = event.data.buffer;
                console.log('[GranularProcessor] Buffer received', this.buffer.length);
            } else if (event.data.type === 'trigger') {
                // Instead of playing immediately, we queue the event
                console.log(`[GranularProcessor] Trigger received. Target: ${event.data.startTime.toFixed(3)}, Current Worklet Time: ${currentTime.toFixed(3)}`);
                this.queueEvent(event.data);
            } else if (event.data.type === 'stop') {
                // Handle stop command to kill queue and active grains
                console.log('[GranularProcessor] Stop received');
                this.stopAll();
            } else if (event.data.type === 'params') {
                this.params = event.data.params;
            }
        };
    }

    queueEvent(eventData) {
        // Find insertion point to keep queue sorted by time
        let added = false;
        for (let i = 0; i < this.eventQueue.length; i++) {
            if (eventData.startTime < this.eventQueue[i].startTime) {
                this.eventQueue.splice(i, 0, eventData);
                added = true;
                break;
            }
        }
        if (!added) {
            this.eventQueue.push(eventData);
        }
        console.log(`[GranularProcessor] Event queued. Queue size: ${this.eventQueue.length}`);
    }

    stopAll() {
        // 1. Clear the queue so no future grains play
        this.eventQueue = [];
        
        // 2. Deactivate all currently playing grains
        for (let i = 0; i < this.maxGrains; i++) {
            this.grains[i].active = false;
        }
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const currentGlobalTime = currentTime; // AudioWorklet global time
        
        // 1. PROCESS EVENTS FOR THIS BLOCK
        // The render quantum is 128 samples. We check if any queued events
        // are scheduled to start within this time window.
        const blockDuration = 128 / sampleRate;
        const nextBlockTime = currentGlobalTime + blockDuration;

        while (this.eventQueue.length > 0) {
            const nextEvent = this.eventQueue[0];
            
            // If event is in the future (beyond this block), stop checking
            if (nextEvent.startTime >= nextBlockTime) {
                break;
            }

            // Remove from queue
            const event = this.eventQueue.shift();

            // Calculate precise offset in samples relative to the start of this block
            // If time is in the past (late), offset is 0 to play immediately
            let startOffset = Math.floor((event.startTime - currentGlobalTime) * sampleRate);
            
            // Debug timing
            if (startOffset < 0) {
                 console.warn(`[GranularProcessor] Event late by ${Math.abs(startOffset)} samples. Playing immediately.`);
            }

            if (startOffset < 0) startOffset = 0;
            if (startOffset >= 128) startOffset = 127; // Safety clamp
            
            console.log(`[GranularProcessor] Spawning grain at offset ${startOffset}. Block Time: ${currentGlobalTime.toFixed(3)}`);

            this.spawnGrain(event, startOffset);
        }

        // 2. RENDER AUDIO
        for (let channel = 0; channel < channelCount; channel++) {
            const outputChannel = output[channel];
            
            // Clear buffer
            outputChannel.fill(0);
            
            // Mix grains
            for (let i = 0; i < this.maxGrains; i++) {
                const grain = this.grains[i];
                if (grain.active) {
                    this.processGrain(grain, outputChannel, channel, 128); // 128 is block size
                }
            }
        }

        return true;
    }

    spawnGrain(params, offset) {
        if (!this.buffer) {
             console.warn('[GranularProcessor] Cannot spawn grain: No buffer loaded');
             return;
        }

        // Find inactive grain
        const grain = this.grains.find(g => !g.active);
        if (!grain) {
             console.warn('[GranularProcessor] Cannot spawn grain: Max grains reached');
             return; 
        }

        // Reset grain parameters
        grain.active = true;
        
        // START TIME OFFSET
        grain.startOffset = offset; 
        
        // Calculate parameters based on inputs
        const position = Math.max(0, Math.min(1, params.position));
        const duration = Math.max(0.01, params.density); // density controls grain length
        const pitch = params.pitch || 1;
        
        grain.buffer = this.buffer;
        grain.windowSize = duration * sampleRate;
        grain.position = Math.floor(position * this.buffer.length);
        grain.currentSample = 0;
        grain.increment = pitch;
        grain.volume = params.volume || 0.5;
        grain.isReverse = params.reverse || false;
        
        // Apply randomization (spray)
        if (params.spray) {
            const spraySamples = params.spray * sampleRate;
            grain.position += (Math.random() * spraySamples * 2) - spraySamples;
            // Clamp
            if (grain.position < 0) grain.position = 0;
            if (grain.position >= this.buffer.length) grain.position = this.buffer.length - 1;
        }
    }

    processGrain(grain, outputBuffer, channel, blockSize) {
        // If grain has a startOffset, we must wait that many samples before rendering
        let startIndex = 0;
        if (grain.startOffset > 0) {
            startIndex = grain.startOffset;
            // We only process this offset once per grain activation
            grain.startOffset = 0; 
        }

        for (let i = startIndex; i < blockSize; i++) {
            if (!grain.active) break;

            // Hanning Window
            const phase = grain.currentSample / grain.windowSize;
            if (phase >= 1) {
                grain.active = false;
                break;
            }
            
            const window = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
            
            // Read from buffer
            let sampleVal = 0;
            const bufferIdx = Math.floor(grain.position);
            
            if (bufferIdx >= 0 && bufferIdx < grain.buffer.length) {
                sampleVal = grain.buffer[bufferIdx];
            }

            // Write to output
            outputBuffer[i] += sampleVal * window * grain.volume;

            // Advance
            if (grain.isReverse) {
                grain.position -= grain.increment;
            } else {
                grain.position += grain.increment;
            }
            grain.currentSample++;
        }
    }
}

registerProcessor('granular-processor', GranularProcessor);