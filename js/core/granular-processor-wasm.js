// =============================================================================
// BeatOS Granular Processor - WASM Bridge
// This replaces the inline getWorkletCode() in GranularSynthWorklet.js
// It loads the compiled WASM module and delegates DSP to it.
// =============================================================================

class BeatOSGranularProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.MAX_TRACKS = 32;
    this.wasmReady = false;
    this.wasmInstance = null;
    this.wasmMemory = null;
    this.wasmExports = null;

    // Fallback JS state (used until WASM loads, or if WASM fails)
    this.useFallback = false;
    this.activeNotes = [];
    this.lastReportedCount = 0;

    // Track buffer metadata for WASM memory management
    this.trackBufferOffsets = new Map();

    this.port.onmessage = (e) => {
      const { type, data } = e.data;
      switch (type) {
        case 'initWasm':
          this.initWasm(data.wasmBinary);
          break;
        case 'noteOn':
          this.handleNoteOn(data);
          break;
        case 'setBuffer':
          this.handleSetBuffer(data.trackId, data.buffer);
          break;
        case 'stopAll':
          if (this.wasmReady) this.wasmExports.stopAll();
          break;
        case 'stopTrack':
          if (this.wasmReady) this.wasmExports.stopTrack(data.trackId);
          break;
        case 'setMaxGrains':
          if (this.wasmReady) this.wasmExports.setSafetyLimit(data.max);
          break;
      }
    };
  }

  async initWasm(wasmBinary) {
    try {
      // Create shared memory (256 pages = 16MB, enough for 32 tracks of 5s samples)
      this.wasmMemory = new WebAssembly.Memory({
        initial: 64,   // 4MB
        maximum: 256,   // 16MB
        shared: false
      });

      const importObject = {
        env: {
          memory: this.wasmMemory,
          abort: (msg, file, line, col) => {
            console.error(`WASM abort at ${line}:${col}`);
          },
          'Math.cos': Math.cos,
          'Math.max': Math.max,
          'Math.min': Math.min,
          'Math.abs': Math.abs
        }
      };

      const module = await WebAssembly.compile(wasmBinary);
      this.wasmInstance = await WebAssembly.instantiate(module, importObject);
      this.wasmExports = this.wasmInstance.exports;

      // If WASM exports its own memory, use that instead
      if (this.wasmExports.memory) {
        this.wasmMemory = this.wasmExports.memory;
      }

      // Initialize LUT and clear state
      this.wasmExports.init();

      this.wasmReady = true;
      this.port.postMessage({ type: 'wasmReady' });
      console.log('[GranularProcessor] WASM DSP engine loaded');
    } catch (err) {
      console.error('[GranularProcessor] WASM init failed, using JS fallback:', err);
      this.useFallback = true;
      this.port.postMessage({ type: 'wasmFailed', error: err.message });
    }
  }

  handleNoteOn(data) {
    if (!this.wasmReady) return;

    const p = data.params;
    this.wasmExports.pushNote(
      data.trackId,
      data.time,
      data.duration,
      p.position,
      p.scanSpeed,
      p.windowStart,
      p.windowEnd,
      p.density,
      p.grainSize,
      p.overlap || 0,
      p.pitch,
      p.velocity,
      p.spray,
      p.cleanMode ? 1 : 0,
      p.edgeCrunch || 0,
      p.orbit || 0,
      p.resetOnBar ? 1 : 0,
      p.resetOnTrig ? 1 : 0
    );
  }

  handleSetBuffer(trackId, bufferData) {
    if (!this.wasmReady) return;

    // Allocate space in WASM memory for this track's samples
    const lengthSamples = bufferData.length;
    const byteOffset = this.wasmExports.allocateTrackBuffer(trackId, lengthSamples);

    // Copy sample data into WASM linear memory
    const wasmF32View = new Float32Array(
      this.wasmMemory.buffer,
      byteOffset,
      lengthSamples
    );
    wasmF32View.set(bufferData);

    this.trackBufferOffsets.set(trackId, { offset: byteOffset, length: lengthSamples });
  }

  process(inputs, outputs, parameters) {
    if (!this.wasmReady) {
      return true; // Keep alive, just output silence
    }

    const frameCount = outputs[0] ? outputs[0][0].length : 128;

    // Run WASM DSP
    const activeCount = this.wasmExports.process(
      currentTime,
      sampleRate,
      frameCount
    );

    // Copy output from WASM memory to AudioWorklet outputs
    const outputBase = this.wasmExports.getOutputBase();
    const wasmBuf = this.wasmMemory.buffer;

    for (let t = 0; t < outputs.length && t < this.MAX_TRACKS; t++) {
      const trackOut = outputs[t];
      if (!trackOut || !trackOut[0]) continue;

      const lOffset = outputBase + t * 2 * frameCount * 4;
      const rOffset = lOffset + frameCount * 4;

      // Zero-copy view into WASM memory
      const lData = new Float32Array(wasmBuf, lOffset, frameCount);
      const rData = new Float32Array(wasmBuf, rOffset, frameCount);

      trackOut[0].set(lData);
      if (trackOut[1]) {
        trackOut[1].set(rData);
      }
    }

    // Report grain count (throttled)
    if (activeCount !== this.lastReportedCount) {
      this.lastReportedCount = activeCount;
      this.port.postMessage({ type: 'grainCount', count: activeCount });
    }

    return true;
  }
}

registerProcessor('beatos-granular-processor', BeatOSGranularProcessor);