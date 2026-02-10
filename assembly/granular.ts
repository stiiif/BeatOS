// assembly/granular.ts

// --- MEMORY LAYOUT ---
const LUT_SIZE: i32 = 4096;

// --- GLOBALS ---
// Use f64 to match JS 'number' precision for time/phase
var sampleRate: f64 = 44100.0;
var rngState: u32 = 0xCAFEBABE;
var currentFrame: u64 = 0;

// Maximums
const MAX_VOICES: i32 = 64;

class Voice {
    active: bool = false;
    trackId: i32 = 0;
    bufferPtr: usize = 0; 
    bufferLength: i32 = 0;
    
    // CRITICAL: Use f64 for position/phase to match JS precision
    position: f64 = 0.0; 
    phase: f64 = 0.0;    
    grainLength: f64 = 0.0;
    invGrainLength: f64 = 0.0;
    pitch: f64 = 1.0;
    
    // Amplitudes can be f32 (audio data is f32 anyway)
    velocity: f32 = 1.0;
    releasing: bool = false;
    releaseAmp: f32 = 1.0;
    cleanMode: bool = false;
    edgeCrunch: f32 = 0.0;
    orbit: f64 = 0.0;
    startFrame: u64 = 0;
}

var voices: Voice[] = new Array<Voice>(MAX_VOICES);
for (let i = 0; i < MAX_VOICES; i++) voices[i] = new Voice();

var windowLUT: StaticArray<f32> = new StaticArray<f32>(LUT_SIZE);

export function init(sr: f64): void {
    sampleRate = sr;
    
    // Generate Tukey Window (Exact math from JS)
    const alpha: f32 = 0.5;
    for (let i = 0; i < LUT_SIZE; i++) {
        let p: f32 = <f32>i / <f32>(LUT_SIZE - 1);
        let val: f32 = 1.0;
        if (p < alpha / 2.0) {
            // Cast the Math.cos result (f64) to f32
            val = <f32>(0.5 * (1.0 + Math.cos(Math.PI * (2.0 * p / alpha - 1.0))));
        } else if (p > 1.0 - alpha / 2.0) {
            // Cast the Math.cos result (f64) to f32
            val = <f32>(0.5 * (1.0 + Math.cos(Math.PI * (2.0 * p / alpha - 2.0 / alpha + 1.0))));
        }
        windowLUT[i] = val;
    }
}

// XorShift Random (Match JS logic exactly)
// JS: (this._rngState >>> 0) / 4294967296
function random(): f64 {
    rngState ^= rngState << 13;
    rngState ^= rngState >>> 17;
    rngState ^= rngState << 5;
    return <f64>(rngState >>> 0) / 4294967296.0;
}

export function spawnGrain(
    trackId: i32,
    bufferPtr: usize,
    bufferLen: i32,
    position: f64,
    grainLenSamples: i32,
    pitch: f64,
    velocity: f32,
    cleanMode: bool,
    edgeCrunch: f32,
    orbit: f64
): void {
    let voiceIndex: i32 = -1;
    // Find free voice
    for (let i = 0; i < MAX_VOICES; i++) {
        if (!voices[i].active) {
            voiceIndex = i;
            break;
        }
    }

    // Voice Stealing
    if (voiceIndex == -1) {
        let oldestTime: u64 = <u64>-1;
        let oldestIdx: i32 = -1;
        for (let i = 0; i < MAX_VOICES; i++) {
            if (!voices[i].releasing && voices[i].startFrame < oldestTime) {
                oldestTime = voices[i].startFrame;
                oldestIdx = i;
            }
        }
        if (oldestIdx != -1) {
            voices[oldestIdx].releasing = true;
            return;
        }
        return;
    }

    let v = voices[voiceIndex];
    v.active = true;
    v.trackId = trackId;
    v.bufferPtr = bufferPtr;
    v.bufferLength = bufferLen;
    v.position = position;
    v.phase = 0.0;
    v.grainLength = <f64>Math.max(128, grainLenSamples);
    v.invGrainLength = <f64>(LUT_SIZE - 1) / v.grainLength;
    v.pitch = pitch;
    v.velocity = velocity;
    v.releasing = false;
    v.releaseAmp = 1.0;
    v.cleanMode = cleanMode;
    v.edgeCrunch = edgeCrunch;
    v.orbit = orbit;
    v.startFrame = currentFrame;
}

export function processAudioBlock(
    outputPtr: usize, 
    frameCount: i32,
    activeVoiceCount: i32
): void {
    
    for (let i = 0; i < MAX_VOICES; i++) {
        let v = voices[i];
        if (!v.active) continue;

        let offsetL = (v.trackId * 2 * frameCount) * 4;
        let offsetR = (v.trackId * 2 * frameCount + frameCount) * 4;
        
        // F64 Precision for start position
        let startPos: f64 = v.position * <f64>v.bufferLength;
        let useCubic = (v.pitch > 1.2 || v.pitch < 0.8);
        
        let trackScale: f32 = 1.0;
        if (v.cleanMode) {
            trackScale = 1.0 / <f32>Math.max(1, activeVoiceCount);
        } else {
            trackScale = 1.0 / (1.0 + (<f32>activeVoiceCount * 0.15));
        }

        for (let j = 0; j < frameCount; j++) {
            if (v.releasing) {
                v.releaseAmp -= 0.015;
                if (v.releaseAmp < 0.001) {
                    v.active = false;
                    break;
                }
            }

            if (v.phase >= v.grainLength) {
                v.active = false;
                break;
            }

            // High Precision Read Head
            let readPos: f64 = startPos + (v.phase * v.pitch);
            let idx: i32 = <i32>readPos; 
            
            // Wrap (Logic must match JS while loop)
            let bufLen = v.bufferLength;
            while (idx >= bufLen) idx -= bufLen;
            while (idx < 0) idx += bufLen;

            let frac: f32 = <f32>(readPos - <f64>idx);
            let sample: f32 = 0.0;

            if (useCubic) {
                let i0 = idx - 1; if (i0 < 0) i0 += bufLen;
                let i1 = idx;
                let i2 = idx + 1; if (i2 >= bufLen) i2 -= bufLen;
                let i3 = idx + 2; if (i3 >= bufLen) i3 -= bufLen;

                let y0 = load<f32>(v.bufferPtr + (i0 << 2));
                let y1 = load<f32>(v.bufferPtr + (i1 << 2));
                let y2 = load<f32>(v.bufferPtr + (i2 << 2));
                let y3 = load<f32>(v.bufferPtr + (i3 << 2));

                let c0 = y1;
                let c1 = 0.5 * (y2 - y0); // 0.5 is f64 literal, promotes to f64
                let c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
                let c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

                // Entire expression needs to be f32.
                // We cast intermediate or final result.
                // Explicitly casting the coefficients calculation results to f32 can also help
                // but casting the final sample result is safer.
                sample = <f32>(((c3 * frac + c2) * frac + c1) * frac + c0);
            } else {
                let i2 = idx + 1; 
                if (i2 >= bufLen) i2 = 0;
                
                let s1 = load<f32>(v.bufferPtr + (idx << 2));
                let s2 = load<f32>(v.bufferPtr + (i2 << 2));
                sample = s1 + frac * (s2 - s1);
            }

            let lutIdx = <i32>(v.phase * v.invGrainLength);
            if (lutIdx >= LUT_SIZE) lutIdx = LUT_SIZE - 1;
            let win = windowLUT[lutIdx];

            let out = sample * win * v.velocity * v.releaseAmp * trackScale;

            if (v.edgeCrunch > 0.0) {
                out *= (1.0 + v.edgeCrunch * 2.0);
                // Math.tanh returns f64, cast to f32
                out = <f32>Math.tanh(out);
            }

            let outL_Ptr = outputPtr + offsetL + (j << 2);
            let outR_Ptr = outputPtr + offsetR + (j << 2);
            
            store<f32>(outL_Ptr, load<f32>(outL_Ptr) + out);
            store<f32>(outR_Ptr, load<f32>(outR_Ptr) + out);

            v.phase += 1.0;
        }
    }
    
    currentFrame += <u64>frameCount;
}

export function getActiveVoiceCount(): i32 {
    let count = 0;
    for(let i=0; i<MAX_VOICES; i++) {
        if(voices[i].active) count++;
    }
    return count;
}