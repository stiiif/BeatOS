// assembly/index.ts

// --- CONFIGURATION ---
const MAX_VOICES: i32 = 64;
const MAX_TRACKS: i32 = 32;
const LUT_SIZE: i32 = 4096;
const BLOCK_SIZE: i32 = 128;

// --- MEMORY OFFSETS ---
// We start our manual heap 1MB (1048576 bytes) after the base.
// This leaves plenty of room for Voice objects and LUTs (which take ~20-30KB).
var heapPtr: usize = 0;

// --- STATE STORAGE ---
const trackBufferPtrs = new StaticArray<usize>(MAX_TRACKS);
const trackBufferLens = new StaticArray<i32>(MAX_TRACKS);

class Voice {
  active: boolean = false;
  trackId: i32 = 0;
  bufferPtr: usize = 0;
  bufferLen: i32 = 0;
  position: f32 = 0.0;
  increment: f32 = 1.0;
  grainLen: f32 = 0.0;
  phase: f32 = 0.0;
  winScale: f32 = 0.0;
  amp: f32 = 1.0;
  panL: f32 = 0.7;
  panR: f32 = 0.7;
  releasing: boolean = false;
  releaseAmp: f32 = 1.0;
  edgeCrunch: f32 = 0.0;
  cleanMode: boolean = false;
}

const voices = new StaticArray<Voice>(MAX_VOICES);
const windowLUT = new Float32Array(LUT_SIZE);

var rngState: u32 = 0xCAFEBABE;

export function init(): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    voices[i] = new Voice();
  }

  // Tukey Window Generation
  const alpha: f32 = 0.5;
  for (let i = 0; i < LUT_SIZE; i++) {
    let p: f32 = <f32>i / <f32>(LUT_SIZE - 1);
    let val: f32 = 1.0;
    if (p < alpha / 2.0) {
      val = <f32>(0.5 * (1.0 + Mathf.cos(Mathf.PI * (2.0 * p / alpha - 1.0))));
    } else if (p > 1.0 - (alpha / 2.0)) {
      val = <f32>(0.5 * (1.0 + Mathf.cos(Mathf.PI * (2.0 * p / alpha - 2.0 / alpha + 1.0))));
    }
    windowLUT[i] = val;
  }
}

// --- MEMORY MANAGEMENT ---
export function allocateBuffer(size: i32): usize {
  let ptr = heapPtr;
  if (ptr == 0) {
    // FIX: Start 1MB after __heap_base to avoid overwriting Voice objects
    ptr = __heap_base + 1048576; 
  }
  
  let ret = ptr;
  let nextPtr = ptr + <usize>(size * 4);
  
  // Auto-grow memory if we exceed current capacity
  // 1 page = 64KB = 65536 bytes
  let currentPages = memory.size();
  let limit = <usize>currentPages << 16;
  
  if (nextPtr > limit) {
    let bytesNeeded = nextPtr - limit;
    let pagesNeeded = (bytesNeeded + 0xffff) >>> 16;
    memory.grow(<i32>pagesNeeded);
  }

  heapPtr = nextPtr;
  return ret;
}

export function setTrackBuffer(trackId: i32, ptr: usize, length: i32): void {
  if (trackId >= 0 && trackId < MAX_TRACKS) {
    trackBufferPtrs[trackId] = ptr;
    trackBufferLens[trackId] = length;
  }
}

// --- AUDIO PROCESSING ---
export function process(outputPtr: usize, limit: i32): void {
  // Clear Output
  memory.fill(outputPtr, 0, BLOCK_SIZE * 8); // 128 * 2 * 4

  // Count active voices for Clean Mode scaling
  let activeCount: f32 = 0.0;
  for (let i = 0; i < MAX_VOICES; i++) {
    if (voices[i].active) activeCount += 1.0;
  }
  if (activeCount < 1.0) activeCount = 1.0;

  for (let i = 0; i < MAX_VOICES; i++) {
    const v = voices[i];
    if (!v || !v.active) continue;
    
    if (v.bufferPtr < __heap_base || v.bufferLen <= 0) {
       v.active = false;
       continue;
    }

    // Clean Mode Scaling
    let trackScale: f32 = 1.0;
    if (v.cleanMode) {
        trackScale = 1.0 / activeCount;
    } else {
        trackScale = 1.0 / (1.0 + (activeCount * 0.15));
    }

    let ptr = outputPtr;
    
    for (let j = 0; j < BLOCK_SIZE; j++) {
      if (v.releasing) {
        v.releaseAmp -= 0.015; // Matches JS fade out speed
        if (v.releaseAmp <= 0.0) { v.active = false; break; }
      }
      if (v.phase >= v.grainLen) { v.active = false; break; }

      let readIdx: f32 = v.position + v.phase * v.increment;
      
      // Wrap Logic
      while (readIdx >= <f32>v.bufferLen) readIdx -= <f32>v.bufferLen;
      while (readIdx < 0.0) readIdx += <f32>v.bufferLen;

      let idxInt = <i32>readIdx;
      let frac = readIdx - <f32>idxInt;

      // --- CUBIC INTERPOLATION (Hermite) ---
      // Needs 4 points: y0, y1 (current), y2 (next), y3
      let i1 = idxInt;
      let i0 = i1 - 1; if (i0 < 0) i0 += v.bufferLen;
      let i2 = i1 + 1; if (i2 >= v.bufferLen) i2 -= v.bufferLen;
      let i3 = i2 + 1; if (i3 >= v.bufferLen) i3 -= v.bufferLen;

      let y0 = load<f32>(v.bufferPtr + (i0 << 2));
      let y1 = load<f32>(v.bufferPtr + (i1 << 2));
      let y2 = load<f32>(v.bufferPtr + (i2 << 2));
      let y3 = load<f32>(v.bufferPtr + (i3 << 2));

      // 4-point, 3rd-order Hermite
      let c0 = y1;
      let c1 = 0.5 * (y2 - y0);
      let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
      let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

      let sample = ((c3 * frac + c2) * frac + c1) * frac + c0;

      // Windowing
      let lutIdx = <i32>(v.phase * v.winScale * <f32>(LUT_SIZE - 1));
      if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
      let win = windowLUT[unchecked(lutIdx)];

      let out = sample * win * v.amp * v.releaseAmp * trackScale;
      
      // Fix AS200: Explicitly cast calculation result to f32
      let outL = load<f32>(ptr) + (out * v.panL);
      store<f32>(ptr, <f32>outL);
      
      let outR = load<f32>(ptr + 4) + (out * v.panR);
      store<f32>(ptr + 4, <f32>outR);

      ptr += 8;
      v.phase += 1.0;
    }
  }
}

// --- INTERFACE ---
export function noteOn(
  trackId: i32, position: f32, grainSize: f32, pitch: f32, gain: f32, pan: f32, spray: f32, 
  orbit: f32, edgeCrunch: f32, cleanMode: boolean
): void {
  if (trackId < 0 || trackId >= MAX_TRACKS) return;
  
  let bufPtr = trackBufferPtrs[trackId];
  let bufLen = trackBufferLens[trackId];
  
  if (bufPtr == 0) return;

  let v: Voice | null = null;
  for (let i = 0; i < MAX_VOICES; i++) {
    const candidate = voices[i];
    if (candidate && !candidate.active) {
      v = candidate;
      break;
    }
  }
  if (v == null) {
    v = voices[0]; 
    if (v) v.releasing = true;
  }
  if (!v) return;

  let pos = position;
  
  // Orbit (Wandering Position)
  if (orbit > 0.0) {
      pos += (randomF32() - 0.5) * orbit;
  }

  // Spray (Random Offset)
  if (spray > 0.0) {
    pos += (randomF32() * 2.0 - 1.0) * spray;
  }
  
  // Clamp Position
  if (pos < 0.0) pos = 0.0;
  if (pos > 1.0) pos = 1.0;

  v.active = true;
  v.trackId = trackId;
  v.bufferPtr = bufPtr;
  v.bufferLen = bufLen;
  v.position = pos * <f32>bufLen;
  v.grainLen = grainSize * 44100.0; 
  if (v.grainLen < 1.0) v.grainLen = 1.0;
  v.phase = 0.0;
  v.increment = pitch;
  v.winScale = 1.0 / v.grainLen;
  v.amp = gain;
  v.releasing = false;
  v.releaseAmp = 1.0;
  v.edgeCrunch = edgeCrunch;
  v.cleanMode = cleanMode;
  
  let piOver4 = Mathf.PI / 4.0;
  let p = (pan + 1.0) * 0.5;
  v.panL = Mathf.cos(p * piOver4);
  v.panR = Mathf.sin(p * piOver4);
}

function randomF32(): f32 {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return <f32>rngState / 4294967296.0;
}

export function stopAll(): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    const v = voices[i];
    if (v) v.releasing = true;
  }
}