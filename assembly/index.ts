// assembly/index.ts
// Compile with: npm run asbuild

// --- IMPORTS ---
@external("env", "consoleLogf")
declare function consoleLogf(val: f32): void;

@external("env", "consoleLogi")
declare function consoleLogi(val: i32): void;

// --- GLOBALS & HEAP BASE ---
// HEAP_BASE is a usize. We cast to i32 for our pointer arithmetic.
const HEAP_BASE = <i32>((__heap_base + 15) & ~15);

// --- CONSTANTS ---
const MAX_VOICES: i32 = 64;
const MAX_TRACKS: i32 = 32;
const BLOCK_SIZE: i32 = 128; 
const LUT_SIZE: i32 = 4096;

// --- MEMORY LAYOUT ---
const BYTES_PER_FLOAT: i32 = 4;
const BYTES_PER_CHANNEL: i32 = BLOCK_SIZE * BYTES_PER_FLOAT; // 512
const BYTES_PER_TRACK: i32 = BYTES_PER_CHANNEL * 2; // 1024
const TOTAL_OUTPUT_SIZE: i32 = MAX_TRACKS * BYTES_PER_TRACK; // 32768

// Move our manual memory regions to be AFTER the AS Runtime data
const PTR_OUTPUT_START: i32 = HEAP_BASE;
const PTR_LUT: i32 = PTR_OUTPUT_START + TOTAL_OUTPUT_SIZE;
let PTR_SAMPLES_START: i32 = PTR_LUT + (LUT_SIZE * BYTES_PER_FLOAT);

// --- STRUCTS ---
class Voice {
  active: boolean = false;
  trackId: i32 = 0;
  bufferPtr: i32 = 0;
  bufferLen: i32 = 0;
  position: f32 = 0.0;
  phase: f32 = 0.0;
  grainLength: f32 = 0.0;
  pitch: f32 = 1.0;
  velocity: f32 = 1.0;
  invGrainLength: f32 = 0.0;
  releasing: boolean = false;
  releaseAmp: f32 = 1.0;
  startOffset: i32 = 0; // NEW: Samples to wait before playing
}

// Global State
let voices: StaticArray<Voice> = new StaticArray<Voice>(MAX_VOICES);
let trackBufferPtrs: StaticArray<i32> = new StaticArray<i32>(MAX_TRACKS);
let trackBufferLens: StaticArray<i32> = new StaticArray<i32>(MAX_TRACKS);
let rngState: u32 = 0xCAFEBABE;

// --- INITIALIZATION ---
export function init(): void {
  // Ensure we have enough initial memory for our static buffers
  // PTR_SAMPLES_START is the end of our static reservation
  let requiredInitialBytes = PTR_SAMPLES_START;
  let currentBytes = memory.size() * 65536;
  if (requiredInitialBytes > currentBytes) {
      let pages = <i32>((requiredInitialBytes - currentBytes + 65535) / 65536);
      memory.grow(pages);
  }

  for (let i = 0; i < MAX_VOICES; i++) {
    voices[i] = new Voice();
  }

  let alpha: f32 = 0.5;
  for (let i = 0; i < LUT_SIZE; i++) {
    let p: f32 = <f32>i / <f32>(LUT_SIZE - 1);
    let val: f32 = 1.0;
    if (p < alpha / 2.0) {
      val = <f32>(0.5 * (1.0 + Math.cos(Math.PI * <f64>(2.0 * p / alpha - 1.0))));
    } else if (p > 1.0 - alpha / 2.0) {
      val = <f32>(0.5 * (1.0 + Math.cos(Math.PI * <f64>(2.0 * p / alpha - 2.0 / alpha + 1.0))));
    }
    store<f32>(PTR_LUT + (i * 4), val);
  }
}

function random(): f32 {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return <f32>rngState / 4294967296.0;
}

// --- PUBLIC API ---

export function allocateBuffer(trackId: i32, length: i32): i32 {
  let requiredBytes = length * 4;
  let ptr = PTR_SAMPLES_START;
  let endPtr = ptr + requiredBytes;
  
  let currentPages = memory.size();
  let currentPageBytes = currentPages * 65536;
  
  if (endPtr > currentPageBytes) {
    let missingBytes = endPtr - currentPageBytes;
    let pagesNeeded = (missingBytes + 65535) / 65536; 
    let pages = <i32>pagesNeeded; 
    memory.grow(pages);
  }

  PTR_SAMPLES_START = endPtr; 
  
  trackBufferPtrs[trackId] = ptr;
  trackBufferLens[trackId] = length;
  return ptr; 
}

export function getOutputBufferPtr(): i32 {
    return PTR_OUTPUT_START;
}

export function spawnGrain(
  trackId: i32, 
  position: f32, 
  grainSizeSec: f32, 
  pitch: f32, 
  velocity: f32, 
  spray: f32, 
  sampleRate: f32,
  startOffset: i32 // NEW PARAMETER
): void {
  let bufLen = trackBufferLens[trackId];
  if (bufLen < 2) return;

  let vIdx = -1;
  for (let i = 0; i < MAX_VOICES; i++) {
    if (!voices[i].active) {
      vIdx = i;
      break;
    }
  }
  if (vIdx == -1) return;

  let v = voices[vIdx];
  let finalPos = position;
  if (spray > 0) {
    finalPos += (random() * 2.0 - 1.0) * spray;
    if (finalPos < 0) finalPos = 0;
    if (finalPos > 1) finalPos = 1;
  }

  v.active = true;
  v.trackId = trackId;
  v.bufferPtr = trackBufferPtrs[trackId];
  v.bufferLen = bufLen;
  v.position = finalPos * <f32>bufLen;
  v.phase = 0;
  v.pitch = pitch;
  v.velocity = velocity;
  v.releasing = false;
  v.releaseAmp = 1.0;
  v.startOffset = startOffset; // Assign offset
  
  let gLen = <f32>(Math.floor(grainSizeSec * sampleRate));
  if (gLen < 128) gLen = 128;
  v.grainLength = gLen;
  v.invGrainLength = <f32>(LUT_SIZE - 1) / gLen;
}

export function process(sampleRate: f32): void {
  // Clear Outputs
  memory.fill(PTR_OUTPUT_START, 0, TOTAL_OUTPUT_SIZE);

  for (let i = 0; i < MAX_VOICES; i++) {
    let v = voices[i];
    if (!v.active) continue;

    let ptr = v.bufferPtr;
    let len = v.bufferLen;
    
    if (len < 2) {
      v.active = false;
      continue;
    }

    let pitch = v.pitch;
    let invGL = v.invGrainLength;
    let gLen = v.grainLength;
    let startPos = v.position;
    
    let trackBasePtr = PTR_OUTPUT_START + (v.trackId * BYTES_PER_TRACK);
    
    if (trackBasePtr < PTR_OUTPUT_START || trackBasePtr >= (PTR_OUTPUT_START + TOTAL_OUTPUT_SIZE)) {
        v.active = false;
        continue;
    }

    let useCubic = (pitch > 1.2 || pitch < 0.8);

    for (let j = 0; j < BLOCK_SIZE; j++) {
      // NEW: Handle Start Offset
      if (v.startOffset > 0) {
        v.startOffset--;
        // Output is already cleared to 0 at start of process(), so we just skip logic
        continue; 
      }

      if (v.phase >= gLen) {
        v.active = false;
        break;
      }

      let readPos = startPos + (v.phase * pitch);
      while (readPos >= <f32>len) readPos -= <f32>len;
      while (readPos < 0) readPos += <f32>len;

      let idx = <i32>readPos;
      let frac = readPos - <f32>idx;
      let sample: f32 = 0.0;

      if (useCubic) {
        let i0 = idx - 1; if (i0 < 0) i0 += len;
        let i1 = idx;
        let i2 = idx + 1; if (i2 >= len) i2 -= len;
        let i3 = idx + 2; if (i3 >= len) i3 -= len;

        let y0 = load<f32>(ptr + (i0 * 4));
        let y1 = load<f32>(ptr + (i1 * 4));
        let y2 = load<f32>(ptr + (i2 * 4));
        let y3 = load<f32>(ptr + (i3 * 4));

        let c0 = y1;
        let c1 = 0.5 * (y2 - y0);
        let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

        sample = <f32>(((c3 * frac + c2) * frac + c1) * frac + c0);
      } else {
        let idx2 = idx + 1;
        if (idx2 >= len) idx2 = 0;
        let s1 = load<f32>(ptr + (idx * 4));
        let s2 = load<f32>(ptr + (idx2 * 4));
        sample = s1 + frac * (s2 - s1);
      }

      let lutIdx = <i32>(v.phase * invGL);
      if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
      let win = load<f32>(PTR_LUT + (lutIdx * 4));

      let out = sample * win * v.velocity * v.releaseAmp;
      
      let sampleOffset = j * 4;

      let outPtrL = trackBasePtr + sampleOffset;
      let currentL = load<f32>(outPtrL);
      store<f32>(outPtrL, currentL + out);
      
      let outPtrR = trackBasePtr + BYTES_PER_CHANNEL + sampleOffset;
      let currentR = load<f32>(outPtrR);
      store<f32>(outPtrR, currentR + out);

      v.phase += 1.0;
    }
  }
}