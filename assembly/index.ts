// BeatOS Granular DSP Engine (AssemblyScript)
// Implements Sample-Accurate Scheduling and Cubic Interpolation

// --- CONSTANTS ---
const MAX_VOICES: i32 = 64;
const LUT_SIZE: i32 = 4096;
const MAX_TRACKS: i32 = 32;

// --- STATE ---
const trackBufferPtrs = new StaticArray<usize>(MAX_TRACKS);
const trackBufferLens = new StaticArray<i32>(MAX_TRACKS);

const windowLUT = new Float32Array(LUT_SIZE);
var rngState: u32 = 0xCAFEBABE;

// Test Tone State
var testPhase: f32 = 0.0;

// --- STRUCTS ---
class Voice {
  active: boolean = false;
  trackId: i32 = 0;
  bufferPtr: usize = 0;
  bufferLen: i32 = 0;
  position: f32 = 0.0;
  phase: i32 = 0;
  grainLength: i32 = 0;
  invGrainLength: f32 = 0.0;
  pitch: f32 = 1.0;
  velocity: f32 = 1.0;
  releasing: boolean = false;
  releaseAmp: f32 = 1.0;
  startOffset: i32 = 0; 
}

const voices = new StaticArray<Voice>(MAX_VOICES);
const freeVoiceIndices = new Int32Array(MAX_VOICES);
var freeVoiceCount: i32 = MAX_VOICES;

// --- INITIALIZATION ---
export function init(): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    voices[i] = new Voice();
    freeVoiceIndices[i] = i;
  }

  const alpha: f32 = 0.5;
  for (let i = 0; i < LUT_SIZE; i++) {
    let p = <f32>i / <f32>(LUT_SIZE - 1);
    let val: f32 = 1.0;
    if (p < alpha / 2.0) {
      let arg = Math.PI * (2.0 * <f64>p / <f64>alpha - 1.0);
      val = <f32>(0.5 * (1.0 + Math.cos(arg)));
    } else if (p > 1.0 - alpha / 2.0) {
      let arg = Math.PI * (2.0 * <f64>p / <f64>alpha - 2.0 / <f64>alpha + 1.0);
      val = <f32>(0.5 * (1.0 + Math.cos(arg)));
    }
    windowLUT[i] = val;
  }
}

// --- MEMORY HELPERS ---
export function allocateBuffer(size: i32): usize {
  return heap.alloc(size * 4); 
}

export function setTrackBuffer(trackId: i32, ptr: usize, length: i32): void {
  if (trackId >= 0 && trackId < MAX_TRACKS) {
    trackBufferPtrs[trackId] = ptr;
    trackBufferLens[trackId] = length;
  }
}

// --- UTILS ---
function random(): f32 {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return <f32>rngState / 4294967296.0;
}

// --- AUDIO PROCESSING ---
export function spawnGrain(
  trackId: i32, position: f32, durationSamples: i32, pitch: f32, velocity: f32, spray: f32, offset: i32
): void {
  if (freeVoiceCount <= 0) return;

  let bufPtr = trackBufferPtrs[trackId];
  let bufLen = trackBufferLens[trackId];
  if (bufPtr == 0 || bufLen < 2) return;

  let voiceIdx = freeVoiceIndices[--freeVoiceCount];
  let v = voices[voiceIdx];

  let startPos = position;
  if (spray > 0) {
    startPos += (random() * 2.0 - 1.0) * spray;
    if (startPos < 0) startPos = 0;
    if (startPos > 1) startPos = 1;
  }

  v.active = true;
  v.trackId = trackId;
  v.bufferPtr = bufPtr;
  v.bufferLen = bufLen;
  v.position = startPos * <f32>bufLen;
  v.phase = 0;
  v.grainLength = durationSamples;
  v.invGrainLength = <f32>(LUT_SIZE - 1) / <f32>durationSamples;
  v.pitch = pitch;
  v.velocity = velocity;
  v.releasing = false;
  v.releaseAmp = 1.0;
  v.startOffset = offset;
}

export function process(outputPtr: usize, frameCount: i32): void {
  // 1. TEST TONE (Debug): Add 440Hz Sine to Track 0
  // Frequency = 440 / 44100 ~= 0.01 per sample * 2PI
  let toneInc = <f32>(2.0 * Math.PI * 440.0 / 44100.0);
  let toneOutL = outputPtr; // Track 0 Left
  
  for (let t = 0; t < frameCount; t++) {
      testPhase += toneInc;
      if (testPhase > <f32>(2.0 * Math.PI)) testPhase -= <f32>(2.0 * Math.PI);
      
      let sample = <f32>(Math.sin(testPhase) * 0.2); // 0.2 Gain
      
      // Mix into Track 0 Left/Right
      let ptr = toneOutL + (t << 2);
      store<f32>(ptr, load<f32>(ptr) + sample);
  }

  // 2. VOICES
  for (let i = 0; i < MAX_VOICES; i++) {
    let v = voices[i];
    if (!v.active) continue;

    let trackOffsetBytes = v.trackId * 2 * frameCount * 4;
    let outL = outputPtr + trackOffsetBytes;
    let outR = outputPtr + trackOffsetBytes + (frameCount * 4);

    let useCubic = (v.pitch > 1.2 || v.pitch < 0.8);
    
    for (let j = 0; j < frameCount; j++) {
      if (j < v.startOffset) continue;

      if (v.releasing) {
        v.releaseAmp -= 0.015;
        if (v.releaseAmp <= 0) {
          v.active = false;
          freeVoiceIndices[freeVoiceCount++] = i;
          break;
        }
      }

      if (v.phase >= v.grainLength) {
        v.active = false;
        freeVoiceIndices[freeVoiceCount++] = i;
        break;
      }

      let readPos = v.position + (<f32>v.phase * v.pitch);
      let idx = <i32>readPos;
      
      while (idx >= v.bufferLen) idx -= v.bufferLen;
      while (idx < 0) idx += v.bufferLen;

      let frac = readPos - <f32>idx;
      let sample: f32 = 0.0;

      if (useCubic) {
        let i0 = idx - 1; if (i0 < 0) i0 += v.bufferLen;
        let i1 = idx;
        let i2 = idx + 1; if (i2 >= v.bufferLen) i2 -= v.bufferLen;
        let i3 = idx + 2; if (i3 >= v.bufferLen) i3 -= v.bufferLen;

        let y0 = load<f32>(v.bufferPtr + (i0 << 2));
        let y1 = load<f32>(v.bufferPtr + (i1 << 2));
        let y2 = load<f32>(v.bufferPtr + (i2 << 2));
        let y3 = load<f32>(v.bufferPtr + (i3 << 2));

        let c0 = y1;
        let c1 = 0.5 * (y2 - y0);
        let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

        sample = <f32>(((c3 * frac + c2) * frac + c1) * frac + c0);
      } else {
        let iNext = idx + 1;
        if (iNext >= v.bufferLen) iNext = 0;
        let s1 = load<f32>(v.bufferPtr + (idx << 2));
        let s2 = load<f32>(v.bufferPtr + (iNext << 2));
        sample = s1 + frac * (s2 - s1);
      }

      let lutIdx = <i32>(<f32>v.phase * v.invGrainLength);
      if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
      let win = unchecked(windowLUT[lutIdx]);

      let outSample = sample * win * v.velocity * v.releaseAmp;

      let ptrL = outL + (j << 2);
      let ptrR = outR + (j << 2);
      
      store<f32>(ptrL, load<f32>(ptrL) + outSample);
      store<f32>(ptrR, load<f32>(ptrR) + outSample);

      v.phase++;
    }
    
    if (v.active) {
        v.startOffset -= frameCount;
        if (v.startOffset < 0) v.startOffset = 0;
    }
  }
}

export function stopAll(): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    if (voices[i].active) {
      voices[i].releasing = true;
    }
  }
}