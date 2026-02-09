// BeatOS Granular DSP Engine (AssemblyScript)

// Configuration
const MAX_VOICES: i32 = 64;
const MAX_TRACKS: i32 = 32;
const BLOCK_SIZE: i32 = 128;
const LUT_SIZE: i32 = 4096;

// --- MEMORY LAYOUT ---

class Voice {
  active: bool = false;
  trackId: i32 = 0;
  
  // Buffer Ptr
  bufferPtr: usize = 0;
  bufferLen: i32 = 0;
  
  // Playback state
  position: f32 = 0.0;
  phase: i32 = 0;
  
  // Parameters
  grainLength: i32 = 0;
  invGrainLength: f32 = 0.0;
  pitch: f32 = 1.0;
  velocity: f32 = 1.0;
  
  // Envelope
  releasing: bool = false;
  releaseAmp: f32 = 1.0;
  
  // FX
  cleanMode: bool = false;
  edgeCrunch: f32 = 0.0;
}

// Static allocation of voices
const voices = new StaticArray<Voice>(MAX_VOICES);

// Output Buffer (Interleaved or Flat)
const OUTPUT_BUFFER_SIZE: i32 = MAX_TRACKS * 2 * BLOCK_SIZE;
const outputBuffer = new Float32Array(OUTPUT_BUFFER_SIZE);

// Track Buffer Registry
const trackBufferPtrs = new StaticArray<usize>(MAX_TRACKS);
const trackBufferLens = new StaticArray<i32>(MAX_TRACKS);

// Window LUT
const windowLUT = new Float32Array(LUT_SIZE);

// --- INITIALIZATION ---

export function init(): void {
  // 1. Initialize Voices
  for (let i = 0; i < MAX_VOICES; i++) {
    voices[i] = new Voice();
  }

  // 2. Generate Tukey Window
  const alpha: f64 = 0.5;
  for (let i = 0; i < LUT_SIZE; i++) {
    let p: f64 = <f64>i / <f64>(LUT_SIZE - 1);
    let val: f64 = 1.0;
    
    if (p < alpha / 2.0) {
      let arg = Math.PI * (2.0 * p / alpha - 1.0);
      val = 0.5 * (1.0 + Math.cos(arg));
    } else if (p > 1.0 - alpha / 2.0) {
      let arg = Math.PI * (2.0 * p / alpha - 2.0 / alpha + 1.0);
      val = 0.5 * (1.0 + Math.cos(arg));
    }
    windowLUT[i] = <f32>val;
  }
}

// --- EXPORTS ---

export function getOutputBufferPtr(): usize {
  return changetype<usize>(outputBuffer.buffer);
}

export function allocateBuffer(length: i32): usize {
  return __new(length * 4, idof<Float32Array>()); 
}

export function setTrackBuffer(trackId: i32, ptr: usize, length: i32): void {
  if (trackId < MAX_TRACKS) {
    trackBufferPtrs[trackId] = ptr;
    trackBufferLens[trackId] = length;
  }
}

// --- GRAIN SCHEDULING ---

export function spawnGrain(
  trackId: i32,
  position: f32,
  grainLengthSamples: i32,
  pitch: f32,
  velocity: f32,
  cleanMode: bool,
  edgeCrunch: f32
): void {
  let voice: Voice | null = null;
  
  // Find free voice
  for (let i = 0; i < MAX_VOICES; i++) {
    if (!voices[i].active) {
      voice = voices[i];
      break;
    }
  }
  
  if (voice == null) return; // Simple drop if full

  if (trackId >= MAX_TRACKS) return;
  const bufPtr = trackBufferPtrs[trackId];
  const bufLen = trackBufferLens[trackId];
  
  if (bufPtr == 0 || bufLen < 4) return; 

  voice.active = true;
  voice.trackId = trackId;
  voice.bufferPtr = bufPtr;
  voice.bufferLen = bufLen;
  
  let startPos = position * <f32>bufLen;
  if (startPos >= <f32>bufLen) startPos -= <f32>bufLen;
  if (startPos < 0.0) startPos = 0.0;
  
  voice.position = startPos;
  voice.phase = 0;
  voice.grainLength = grainLengthSamples;
  voice.invGrainLength = <f32>(LUT_SIZE - 1) / <f32>grainLengthSamples;
  
  voice.pitch = pitch;
  voice.velocity = velocity;
  voice.releasing = false;
  voice.releaseAmp = 1.0;
  voice.cleanMode = cleanMode;
  voice.edgeCrunch = edgeCrunch;
}

// --- DSP LOOP ---

export function process(frameCount: i32): void {
  // Clear Outputs
  memory.fill(
    changetype<usize>(outputBuffer.buffer), 
    0, 
    OUTPUT_BUFFER_SIZE * 4
  );

  for (let i = 0; i < MAX_VOICES; i++) {
    let v = voices[i];
    if (!v.active) continue;

    let pos = v.position;
    let phase = v.phase;
    let ptr = v.bufferPtr;
    let len = v.bufferLen;
    let gLen = v.grainLength;
    let pitch = v.pitch;
    let amp = v.velocity * v.releaseAmp;
    let invGL = v.invGrainLength;
    let trackOffset = v.trackId * 2 * BLOCK_SIZE;
    
    if (ptr == 0) { v.active = false; continue; }

    for (let j = 0; j < frameCount; j++) {
      if (v.releasing) {
        amp -= 0.015; // float literal is f64, will cast down
        if (amp <= 0.0) {
          v.active = false;
          break;
        }
      }
      
      if (phase >= gLen) {
        v.active = false;
        break;
      }

      // Read Position & Wrapping
      let rPos = pos;
      while (rPos >= <f32>len) rPos -= <f32>len;
      while (rPos < 0.0) rPos += <f32>len;

      let idx = <i32>rPos;
      let frac = rPos - <f32>idx;

      // Cubic Hermite Interpolation
      // Access memory raw. Pointer arithmetic: ptr + (index * 4)
      
      let i0 = idx - 1; if (i0 < 0) i0 += len;
      let i1 = idx;
      let i2 = idx + 1; if (i2 >= len) i2 -= len;
      let i3 = idx + 2; if (i3 >= len) i3 -= len;

      let y0 = load<f32>(ptr + (<usize>i0 << 2));
      let y1 = load<f32>(ptr + (<usize>i1 << 2));
      let y2 = load<f32>(ptr + (<usize>i2 << 2));
      let y3 = load<f32>(ptr + (<usize>i3 << 2));

      // Cubic Interpolation
      // Explicit casting to ensure f32 throughout calculation
      let c0 = y1;
      let c1 = 0.5 * (y2 - y0);
      let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
      let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

      // The result of this expression might be promoted to f64 if not careful with literals
      // but usually with variables typed as f32, it stays f32. 
      // We will cast the final result to be safe.
      let sample = <f32>(((c3 * frac + c2) * frac + c1) * frac + c0);

      // Windowing
      let lutIdx = <i32>(<f32>phase * invGL);
      if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
      let win = windowLUT[lutIdx];

      let val = sample * win * amp;

      // Accumulate to Output
      let outPtrL = changetype<usize>(outputBuffer.buffer) + ((trackOffset + j) << 2);
      let outPtrR = changetype<usize>(outputBuffer.buffer) + ((trackOffset + BLOCK_SIZE + j) << 2);
      
      let currentL = load<f32>(outPtrL);
      let currentR = load<f32>(outPtrR);
      
      // Explicit cast to f32 for storage
      store<f32>(outPtrL, currentL + val);
      store<f32>(outPtrR, currentR + val);

      // Advance
      pos += pitch;
      phase++;
    }

    v.position = pos;
    v.phase = phase;
    v.releaseAmp = amp;
  }
}

export function stopAll(): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    voices[i].releasing = true;
  }
}