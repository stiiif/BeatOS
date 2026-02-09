// =============================================================================
// BeatOS Granular DSP - AssemblyScript WASM Module
// Replaces the inner DSP loop of the AudioWorklet for ~3-5x speedup
// =============================================================================

// --- CONSTANTS ---
const MAX_VOICES: i32 = 64;
const LUT_SIZE: i32 = 4096;
const MAX_TRACKS: i32 = 32;
const FRAMES_PER_BLOCK: i32 = 128; // Standard WebAudio render quantum

// --- MEMORY LAYOUT ---
// We use explicit offsets into WASM linear memory for zero-copy audio I/O.
//
// Region 0: Window LUT           [0 .. 16384)          4096 * f32
// Region 1: Voice Pool           [16384 .. 16384 + 64*VOICE_STRIDE)
// Region 2: Active Voice Indices [ACTIVE_IDX_BASE .. +256)
// Region 3: Track Buffer Ptrs    [TRACK_PTRS_BASE .. +256)  pointers + lengths
// Region 4: Track Output Buffers [OUTPUT_BASE .. + 32*2*512)  interleaved L/R per track
// Region 5: Note Queue           [NOTE_QUEUE_BASE .. +NOTE_STRIDE*64)
// Region 6: Track Buffers (dynamic, allocated by host)

// Voice struct layout (bytes per voice)
// 0:  active        i32
// 4:  trackId       i32
// 8:  bufferPtr     i32  (byte offset in memory where this track's samples live)
// 12: bufferLength  i32
// 16: position      f32  (0..1 normalized)
// 20: phase         f32  (sample counter within grain)
// 24: grainLength   f32
// 28: pitch         f32
// 32: velocity      f32
// 36: releasing     i32
// 40: releaseAmp    f32
// 44: invGrainLen   f32
// 48: cleanMode     i32
// 52: edgeCrunch    f32
// 56: orbit         f32
const VOICE_STRIDE: i32 = 64; // Padded to 64 bytes for alignment

// Note struct layout
// 0:  trackId       i32
// 4:  startTime     f64
// 12: duration      f64
// 20: nextGrainTime f64
// 28: basePosition  f32
// 32: scanSpeed     f32
// 36: windowStart   f32
// 40: windowEnd     f32
// 44: density       f32
// 48: grainSize     f32
// 52: overlap       f32
// 56: pitch         f32
// 60: velocity      f32
// 64: spray         f32
// 68: cleanMode     i32
// 72: edgeCrunch    f32
// 76: orbit         f32
// 80: resetOnBar    i32
// 84: resetOnTrig   i32
const NOTE_STRIDE: i32 = 96; // Padded

// Base addresses
const WINDOW_LUT_BASE: i32 = 0;                              // 4096 * 4 = 16384
const VOICE_POOL_BASE: i32 = 16384;                          // 64 * 64 = 4096
const ACTIVE_IDX_BASE: i32 = VOICE_POOL_BASE + MAX_VOICES * VOICE_STRIDE; // 20480, 256 bytes
const TRACK_PTRS_BASE: i32 = ACTIVE_IDX_BASE + 256;          // 20736, 32*(ptr+len) = 256
const OUTPUT_BASE: i32 = TRACK_PTRS_BASE + 256;              // 20992
// Each track output: 2 channels * 128 frames * 4 bytes = 1024 bytes
// 32 tracks * 1024 = 32768
const NOTE_QUEUE_BASE: i32 = OUTPUT_BASE + MAX_TRACKS * 2 * FRAMES_PER_BLOCK * 4; // 53760
// 64 notes * 96 = 6144
const TRACK_BUFFERS_BASE: i32 = NOTE_QUEUE_BASE + 64 * NOTE_STRIDE; // 59904
// Track buffers start here; host allocates by writing sample data

// --- STATE ---
let activeVoiceCount: i32 = 0;
let activeNoteCount: i32 = 0;
let rngState: u32 = 0xCAFEBABE;
let grainCount: i32 = 0;
let safetyLimit: i32 = 400;

// =============================================================================
// INITIALIZATION
// =============================================================================

export function init(): void {
  // Build Hann window LUT
  for (let i: i32 = 0; i < LUT_SIZE; i++) {
    const phase: f32 = <f32>i / <f32>(LUT_SIZE - 1);
    const value: f32 = <f32>(0.5 * (1.0 - Math.cos(<f64>(2.0 * 3.14159265358979 * <f64>phase))));
    store<f32>(WINDOW_LUT_BASE + (i << 2), value);
  }

  // Clear voice pool
  for (let i: i32 = 0; i < MAX_VOICES; i++) {
    const base = VOICE_POOL_BASE + i * VOICE_STRIDE;
    store<i32>(base, 0); // active = false
  }

  activeVoiceCount = 0;
  activeNoteCount = 0;
  grainCount = 0;
}

export function setSafetyLimit(limit: i32): void {
  safetyLimit = limit;
}

// =============================================================================
// FAST RNG (XorShift32)
// =============================================================================

function xorshift(): f32 {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return <f32>(rngState >>> 0) / <f32>4294967296.0;
}

// =============================================================================
// TRACK BUFFER MANAGEMENT
// =============================================================================

// Host calls this to register a track buffer's location in WASM memory
export function setTrackBuffer(trackId: i32, byteOffset: i32, lengthSamples: i32): void {
  if (trackId < 0 || trackId >= MAX_TRACKS) return;
  const ptrBase = TRACK_PTRS_BASE + trackId * 8;
  store<i32>(ptrBase, byteOffset);
  store<i32>(ptrBase + 4, lengthSamples);
}

function getTrackBufferPtr(trackId: i32): i32 {
  return load<i32>(TRACK_PTRS_BASE + trackId * 8);
}

function getTrackBufferLen(trackId: i32): i32 {
  return load<i32>(TRACK_PTRS_BASE + trackId * 8 + 4);
}

// =============================================================================
// NOTE QUEUE (Scheduler feeds notes, DSP spawns grains)
// =============================================================================

export function pushNote(
  trackId: i32,
  startTime: f64,
  duration: f64,
  basePosition: f32,
  scanSpeed: f32,
  windowStart: f32,
  windowEnd: f32,
  density: f32,
  grainSize: f32,
  overlap: f32,
  pitch: f32,
  velocity: f32,
  spray: f32,
  cleanMode: i32,
  edgeCrunch: f32,
  orbit: f32,
  resetOnBar: i32,
  resetOnTrig: i32
): void {
  if (activeNoteCount >= 64) return;

  const base = NOTE_QUEUE_BASE + activeNoteCount * NOTE_STRIDE;
  store<i32>(base + 0, trackId);
  store<f64>(base + 4, startTime);      // Note: f64 needs 8-byte alignment ideally
  store<f64>(base + 12, duration);
  store<f64>(base + 20, startTime);      // nextGrainTime = startTime
  store<f32>(base + 28, basePosition);
  store<f32>(base + 32, scanSpeed);
  store<f32>(base + 36, windowStart);
  store<f32>(base + 40, windowEnd);
  store<f32>(base + 44, density);
  store<f32>(base + 48, grainSize);
  store<f32>(base + 52, overlap);
  store<f32>(base + 56, pitch);
  store<f32>(base + 60, velocity);
  store<f32>(base + 64, spray);
  store<i32>(base + 68, cleanMode);
  store<f32>(base + 72, edgeCrunch);
  store<f32>(base + 76, orbit);
  store<i32>(base + 80, resetOnBar);
  store<i32>(base + 84, resetOnTrig);

  activeNoteCount++;
}

// =============================================================================
// VOICE MANAGEMENT
// =============================================================================

function activateVoice(): i32 {
  // Find free voice
  for (let i: i32 = 0; i < MAX_VOICES; i++) {
    const base = VOICE_POOL_BASE + i * VOICE_STRIDE;
    if (load<i32>(base) == 0) { // not active
      store<i32>(base, 1); // active = true
      // Store index in active list
      store<i32>(ACTIVE_IDX_BASE + (activeVoiceCount << 2), i);
      activeVoiceCount++;
      return i;
    }
  }
  return -1; // No free voice
}

function deactivateVoice(activeIdx: i32): void {
  const voiceIdx = load<i32>(ACTIVE_IDX_BASE + (activeIdx << 2));
  const base = VOICE_POOL_BASE + voiceIdx * VOICE_STRIDE;
  store<i32>(base, 0); // active = false

  // Swap-remove from active list
  activeVoiceCount--;
  if (activeIdx < activeVoiceCount) {
    const lastVoice = load<i32>(ACTIVE_IDX_BASE + (activeVoiceCount << 2));
    store<i32>(ACTIVE_IDX_BASE + (activeIdx << 2), lastVoice);
  }
}

function spawnGrain(noteBase: i32, currentTime: f64): void {
  const trackId = load<i32>(noteBase + 0);
  const bufPtr = getTrackBufferPtr(trackId);
  const bufLen = getTrackBufferLen(trackId);
  if (bufLen < 2) return;

  if (activeVoiceCount >= MAX_VOICES) return;

  const voiceIdx = activateVoice();
  if (voiceIdx < 0) return;

  const startTime = load<f64>(noteBase + 4);
  const basePos = load<f32>(noteBase + 28);
  const scanSpd = load<f32>(noteBase + 32);
  const wStart = load<f32>(noteBase + 36);
  const wEnd = load<f32>(noteBase + 40);
  const grainSz = load<f32>(noteBase + 48);
  const pitch = load<f32>(noteBase + 56);
  const velocity = load<f32>(noteBase + 60);
  const spray = load<f32>(noteBase + 64);
  const cleanMode = load<i32>(noteBase + 68);
  const edgeCrunch = load<f32>(noteBase + 72);
  const orbitVal = load<f32>(noteBase + 76);

  // Calculate position with scan
  const timeSinceStart: f64 = currentTime - startTime;
  let pos: f32 = basePos + <f32>(<f64>scanSpd * timeSinceStart);

  // Window wrapping
  const wSize: f32 = wEnd - wStart;
  if (wSize > 0.0001) {
    let relPos: f32 = pos - wStart;
    // Modulo wrap: ((x % n) + n) % n
    let wrappedRel: f32 = relPos % wSize;
    if (wrappedRel < 0) wrappedRel += wSize;
    pos = wStart + wrappedRel;
  } else {
    pos = wStart;
  }

  // Orbit
  if (orbitVal > 0) {
    pos += (xorshift() - 0.5) * orbitVal;
    if (pos < wStart && wSize > 0.0001) pos += wSize;
    if (pos > wEnd && wSize > 0.0001) pos -= wSize;
  } else {
    pos += xorshift() * 0.0001;
  }

  // Spray
  if (spray > 0) {
    pos += (xorshift() * 2.0 - 1.0) * spray;
  }

  // Clamp
  if (pos < 0) pos = 0;
  if (pos > 1) pos = 1;

  // Write voice data
  const vBase = VOICE_POOL_BASE + voiceIdx * VOICE_STRIDE;
  store<i32>(vBase + 4, trackId);
  store<i32>(vBase + 8, bufPtr);
  store<i32>(vBase + 12, bufLen);
  store<f32>(vBase + 16, pos);
  store<f32>(vBase + 20, 0.0);  // phase = 0
  const gl: f32 = <f32>Math.max(128.0, <f64>(grainSz * 44100.0));
  store<f32>(vBase + 24, gl);   // grainLength
  store<f32>(vBase + 28, pitch);
  store<f32>(vBase + 32, velocity);
  store<i32>(vBase + 36, 0);    // releasing = false
  store<f32>(vBase + 40, 1.0);  // releaseAmp
  store<f32>(vBase + 44, <f32>(LUT_SIZE - 1) / gl); // invGrainLen
  store<i32>(vBase + 48, cleanMode);
  store<f32>(vBase + 52, edgeCrunch);
  store<f32>(vBase + 56, orbitVal);
}

// =============================================================================
// MAIN DSP PROCESS (Called once per audio block from the worklet)
// =============================================================================

export function process(currentTime: f64, sampleRate: f64, frameCount: i32): i32 {
  const blockDuration: f64 = <f64>frameCount / sampleRate;

  // --- CLEAR OUTPUT BUFFERS ---
  const outputBytes = MAX_TRACKS * 2 * frameCount * 4;
  memory.fill(OUTPUT_BASE, 0, outputBytes);

  // --- SCHEDULER: Spawn grains from active notes ---
  let noteIdx: i32 = activeNoteCount - 1;
  while (noteIdx >= 0) {
    const noteBase = NOTE_QUEUE_BASE + noteIdx * NOTE_STRIDE;
    const noteStart = load<f64>(noteBase + 4);
    const noteDuration = load<f64>(noteBase + 12);

    // Remove expired notes
    if (currentTime > noteStart + noteDuration) {
      // Swap-remove
      activeNoteCount--;
      if (noteIdx < activeNoteCount) {
        memory.copy(noteBase, NOTE_QUEUE_BASE + activeNoteCount * NOTE_STRIDE, NOTE_STRIDE);
      }
      noteIdx--;
      continue;
    }

    if (currentTime >= noteStart) {
      const density = load<f32>(noteBase + 44);
      const overlap = load<f32>(noteBase + 52);
      const grainSz = load<f32>(noteBase + 48);

      let interval: f64;
      if (overlap > 0.01) {
        interval = <f64>grainSz / <f64>Math.max(0.1, <f64>overlap);
      } else {
        interval = 1.0 / <f64>Math.max(0.1, <f64>density);
      }

      let nextGrainTime = load<f64>(noteBase + 20);
      let spawnLimit: i32 = 5;

      while (nextGrainTime < currentTime + blockDuration && spawnLimit > 0) {
        if (nextGrainTime >= currentTime) {
          if (activeVoiceCount < MAX_VOICES) {
            spawnGrain(noteBase, currentTime);
          }
        }
        nextGrainTime += interval;
        spawnLimit--;
      }

      store<f64>(noteBase + 20, nextGrainTime);
    }

    noteIdx--;
  }

  // --- DSP: Render active voices ---
  let i: i32 = activeVoiceCount - 1;
  while (i >= 0) {
    const voiceIdx = load<i32>(ACTIVE_IDX_BASE + (i << 2));
    const vBase = VOICE_POOL_BASE + voiceIdx * VOICE_STRIDE;

    const trackId = load<i32>(vBase + 4);
    const bufPtr = load<i32>(vBase + 8);
    const bufLen = load<i32>(vBase + 12);

    if (bufLen < 2) {
      deactivateVoice(i);
      i--;
      continue;
    }

    const pitch = load<f32>(vBase + 28);
    const grainLen = load<f32>(vBase + 24);
    const invGL = load<f32>(vBase + 44);
    const baseVelocity = load<f32>(vBase + 32);
    const posNorm = load<f32>(vBase + 16);
    const startSample: f32 = posNorm * <f32>bufLen;
    const isClean = load<i32>(vBase + 48);
    const eCrunch = load<f32>(vBase + 52);

    let phase = load<f32>(vBase + 20);
    let releasing = load<i32>(vBase + 36);
    let relAmp = load<f32>(vBase + 40);

    // Output buffer addresses for this track
    const outLBase = OUTPUT_BASE + trackId * 2 * frameCount * 4;
    const outRBase = outLBase + frameCount * 4;

    // Scale factor
    const trackScale: f32 = isClean
      ? 1.0 / <f32>Math.max(1.0, <f64>activeVoiceCount)
      : 1.0 / (1.0 + <f32>activeVoiceCount * 0.15);

    let killed = false;

    for (let j: i32 = 0; j < frameCount; j++) {
      // Release envelope
      if (releasing) {
        relAmp -= 0.015;
        if (relAmp <= 0.0) {
          deactivateVoice(i);
          killed = true;
          break;
        }
      }

      // Grain end
      if (phase >= grainLen) {
        deactivateVoice(i);
        killed = true;
        break;
      }

      // Read position
      let rPos: f32 = startSample + phase * pitch;

      // Wrap
      const fBufLen: f32 = <f32>bufLen;
      while (rPos >= fBufLen) rPos -= fBufLen;
      while (rPos < 0) rPos += fBufLen;

      let idx: i32 = <i32>rPos;
      let frac: f32 = rPos - <f32>idx;

      // Edge crunch distortion
      if (!isClean && eCrunch > 0) {
        const maxOverflow: f32 = 1.0 + eCrunch * eCrunch * eCrunch * fBufLen;
        if (frac < 0) {
          if (frac < -maxOverflow) frac = -maxOverflow;
        } else {
          if (frac > maxOverflow) frac = maxOverflow;
        }
      }

      // Linear interpolation
      const s1: f32 = load<f32>(bufPtr + (idx << 2));
      const idx2: i32 = (idx + 1) % bufLen;
      const s2: f32 = load<f32>(bufPtr + (idx2 << 2));
      const sample: f32 = s1 + frac * (s2 - s1);

      // Window lookup
      const winIdx: i32 = <i32>(phase * invGL);
      const clampedWinIdx = winIdx < LUT_SIZE ? winIdx : LUT_SIZE - 1;
      const win: f32 = load<f32>(WINDOW_LUT_BASE + (clampedWinIdx << 2));

      // Final sample value
      const val: f32 = sample * win * baseVelocity * relAmp * trackScale;

      // Accumulate (NaN guard)
      if (val == val) { // NaN check: val != val means NaN
        const lAddr = outLBase + (j << 2);
        const rAddr = outRBase + (j << 2);
        store<f32>(lAddr, load<f32>(lAddr) + val);
        store<f32>(rAddr, load<f32>(rAddr) + val);
      }

      phase += 1.0;
    }

    if (!killed) {
      store<f32>(vBase + 20, phase);
      store<i32>(vBase + 36, releasing);
      store<f32>(vBase + 40, relAmp);
    }

    i--;
  }

  // --- SOFT CLIPPER ---
  for (let t: i32 = 0; t < MAX_TRACKS; t++) {
    const lBase = OUTPUT_BASE + t * 2 * frameCount * 4;
    const rBase = lBase + frameCount * 4;

    for (let j: i32 = 0; j < frameCount; j++) {
      const lAddr = lBase + (j << 2);
      const rAddr = rBase + (j << 2);

      let sL: f32 = load<f32>(lAddr);
      let sR: f32 = load<f32>(rAddr);

      // NaN guard + soft clip: x / (1 + |x|)
      if (sL != sL) sL = 0.0;
      else sL = sL / (1.0 + abs(sL));

      if (sR != sR) sR = 0.0;
      else sR = sR / (1.0 + abs(sR));

      store<f32>(lAddr, sL);
      store<f32>(rAddr, sR);
    }
  }

  grainCount = activeVoiceCount;
  return activeVoiceCount;
}

// =============================================================================
// CONTROL FUNCTIONS
// =============================================================================

export function stopAll(): void {
  for (let i: i32 = 0; i < activeVoiceCount; i++) {
    const voiceIdx = load<i32>(ACTIVE_IDX_BASE + (i << 2));
    const vBase = VOICE_POOL_BASE + voiceIdx * VOICE_STRIDE;
    store<i32>(vBase + 36, 1); // releasing = true
  }
  activeNoteCount = 0;
}

export function stopTrack(trackId: i32): void {
  for (let i: i32 = 0; i < activeVoiceCount; i++) {
    const voiceIdx = load<i32>(ACTIVE_IDX_BASE + (i << 2));
    const vBase = VOICE_POOL_BASE + voiceIdx * VOICE_STRIDE;
    if (load<i32>(vBase + 4) == trackId) {
      store<i32>(vBase + 36, 1); // releasing = true
    }
  }
}

export function getGrainCount(): i32 {
  return grainCount;
}

export function getOutputBase(): i32 {
  return OUTPUT_BASE;
}

export function getTrackBuffersBase(): i32 {
  return TRACK_BUFFERS_BASE;
}

// Host uses this to know where to write sample data
export function allocateTrackBuffer(trackId: i32, lengthSamples: i32): i32 {
  // Simple bump allocator from TRACK_BUFFERS_BASE
  // Each track gets space starting at a known offset
  // For simplicity: trackId * MAX_BUFFER_SIZE
  // Max 5 seconds at 44100 = 220500 samples * 4 bytes = 882000 bytes
  const MAX_BUFFER_BYTES: i32 = 220500 * 4;
  const offset: i32 = TRACK_BUFFERS_BASE + trackId * MAX_BUFFER_BYTES;
  setTrackBuffer(trackId, offset, lengthSamples);
  return offset;
}