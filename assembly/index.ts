// assembly/index.ts
// Compile with: npm run asbuild

// --- IMPORTS ---
@external("env", "consoleLogf")
declare function consoleLogf(val: f32): void;

@external("env", "consoleLogi")
declare function consoleLogi(val: i32): void;

// --- CONSTANTS ---
const MAX_VOICES: i32 = 64;
const MAX_TRACKS: i32 = 32;
const BLOCK_SIZE: i32 = 128; 
const LUT_SIZE: i32 = 4096;

const BYTES_PER_FLOAT: i32 = 4;
const BYTES_PER_CHANNEL: i32 = BLOCK_SIZE * BYTES_PER_FLOAT; // 512
const BYTES_PER_TRACK: i32 = BYTES_PER_CHANNEL * 2; // 1024
const TOTAL_OUTPUT_SIZE: i32 = MAX_TRACKS * BYTES_PER_TRACK; // 32768
const LUT_BYTES: i32 = LUT_SIZE * BYTES_PER_FLOAT; // 16384

// --- GLOBALS ---
// Pointers to our buffers. We will allocate these properly in init().
let PTR_OUTPUT_START: usize = 0;
let PTR_LUT: usize = 0;
// We will manage sample memory manually by allocating a huge chunk or growing manually?
// Since samples are dynamic, we can't easily pre-allocate everything.
// But we can stick to the manual growth strategy for samples if we ensure it starts AFTER our managed objects.
// A safe way is to just keep PTR_SAMPLES_START as a global that we bump.
// But we must ensure it doesn't collide with the heap allocator.
// AssemblyScript's allocator is simple (usually bump pointer too).
// If we want to be safe, we should allocate sample buffers via `new ArrayBuffer` too.
// But `allocateBuffer` needs to return a raw pointer to JS.

// HYBRID APPROACH:
// 1. Outputs and LUT are allocated via `new ArrayBuffer`.
// 2. Samples are allocated via `new ArrayBuffer` and we store the pointers.
// This handles memory growth and fragmentation automatically via the AS runtime.

// Voice class
class Voice {
  active: boolean = false;
  trackId: i32 = 0;
  bufferPtr: usize = 0; // Pointer to data
  bufferLen: i32 = 0;
  position: f32 = 0.0;
  phase: f32 = 0.0;
  grainLength: f32 = 0.0;
  pitch: f32 = 1.0;
  velocity: f32 = 1.0;
  invGrainLength: f32 = 0.0;
  releasing: boolean = false;
  releaseAmp: f32 = 1.0;
}

let voices: StaticArray<Voice> = new StaticArray<Voice>(MAX_VOICES);
let trackBufferPtrs: StaticArray<usize> = new StaticArray<usize>(MAX_TRACKS);
let trackBufferLens: StaticArray<i32> = new StaticArray<i32>(MAX_TRACKS);
let rngState: u32 = 0xCAFEBABE;

// Keep references to buffers to prevent GC (if AS had GC, but we use stub/none usually)
let outputBuffer: ArrayBuffer | null = null;
let lutBuffer: ArrayBuffer | null = null;
// Store sample buffers to keep them alive
let sampleBuffers: Map<i32, ArrayBuffer> = new Map<i32, ArrayBuffer>();

export function init(): void {
  // consoleLogi(1000);
  
  // Allocate Output Buffer
  outputBuffer = new ArrayBuffer(TOTAL_OUTPUT_SIZE);
  PTR_OUTPUT_START = changetype<usize>(outputBuffer);
  
  // Allocate LUT
  lutBuffer = new ArrayBuffer(LUT_BYTES);
  PTR_LUT = changetype<usize>(lutBuffer);

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
    store<f32>(PTR_LUT + (<usize>i * 4), val);
  }
  // consoleLogi(1001);
}

function random(): f32 {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return <f32>rngState / 4294967296.0;
}

export function allocateBuffer(trackId: i32, length: i32): usize {
  let byteLen = length * 4;
  let buf = new ArrayBuffer(byteLen);
  let ptr = changetype<usize>(buf);
  
  // Save it so it's accessible and not collected
  sampleBuffers.set(trackId, buf);
  
  trackBufferPtrs[trackId] = ptr;
  trackBufferLens[trackId] = length;
  
  return ptr; 
}

export function getOutputBufferPtr(): usize {
    return PTR_OUTPUT_START;
}

export function spawnGrain(
  trackId: i32, 
  position: f32, 
  grainSizeSec: f32, 
  pitch: f32, 
  velocity: f32, 
  spray: f32, 
  sampleRate: f32
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
    
    let trackBasePtr = PTR_OUTPUT_START + (<usize>v.trackId * BYTES_PER_TRACK);
    
    // Bounds check might be redundant if we trust logic, but safe
    // Note: total output size logic
    
    let useCubic = (pitch > 1.2 || pitch < 0.8);

    for (let j = 0; j < BLOCK_SIZE; j++) {
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

        // Use usize cast for pointer arithmetic
        let y0 = load<f32>(ptr + (<usize>i0 * 4));
        let y1 = load<f32>(ptr + (<usize>i1 * 4));
        let y2 = load<f32>(ptr + (<usize>i2 * 4));
        let y3 = load<f32>(ptr + (<usize>i3 * 4));

        let c0 = y1;
        let c1 = 0.5 * (y2 - y0);
        let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
        let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

        sample = <f32>(((c3 * frac + c2) * frac + c1) * frac + c0);
      } else {
        let idx2 = idx + 1;
        if (idx2 >= len) idx2 = 0;
        let s1 = load<f32>(ptr + (<usize>idx * 4));
        let s2 = load<f32>(ptr + (<usize>idx2 * 4));
        sample = s1 + frac * (s2 - s1);
      }

      let lutIdx = <i32>(v.phase * invGL);
      if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
      let win = load<f32>(PTR_LUT + (<usize>lutIdx * 4));

      let out = sample * win * v.velocity * v.releaseAmp;
      
      let sampleOffset = <usize>j * 4;

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