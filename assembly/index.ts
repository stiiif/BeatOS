/// <reference path="../node_modules/assemblyscript/dist/assemblyscript.d.ts" />

/**
 * BeatOS High-Performance DSP Module (WASM)
 * - Optimized Cubic Hermite Spline Interpolation
 * - SIMD-ready logic for zero-latency granular synthesis
 */

/**
 * Performs 4-point Cubic Hermite Spline interpolation.
 * This is significantly higher quality than linear interpolation for pitch shifting.
 * @param y0 Previous sample (index - 1)
 * @param y1 Current sample (index 0)
 * @param y2 Next sample (index + 1)
 * @param y3 Following sample (index + 2)
 * @param t Fractional distance between y1 and y2 (0.0 to 1.0)
 */
export function interpolateCubic(y0: f32, y1: f32, y2: f32, y3: f32, t: f32): f32 {
  // 4-point, 3rd-order Hermite Spline coefficients
  const c0: f32 = y1;
  const c1: f32 = 0.5 * (y2 - y0);
  const c2: f32 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
  const c3: f32 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

  // Horner's method for efficient polynomial evaluation
  return ((c3 * t + c2) * t + c1) * t + c0;
}

/**
 * Bulk processing function: Applies a gain ramp to an array of samples.
 * Optimized with SIMD (Single Instruction, Multiple Data) if enabled in compiler.
 */
export function applyGainRamp(data: Float32Array, startGain: f32, endGain: f32): void {
  const len = data.length;
  if (len == 0) return;
  
  const step = (endGain - startGain) / f32(len);
  let currentGain = startGain;

  for (let i = 0; i < len; i++) {
    // 'unchecked' skips bounds checking for massive performance gains in loops
    unchecked(data[i] *= currentGain);
    currentGain += step;
  }
}

/**
 * SIMD-Ready Hermite Spline Coefficient Generator
 * Note: This is an architectural placeholder for a full vectorized loop.
 */
export function computeHermiteCoefficients(y0: f32, y1: f32, y2: f32, y3: f32): Float32Array {
  const out = new Float32Array(4);
  unchecked(out[0] = y1);
  unchecked(out[1] = 0.5 * (y2 - y0));
  unchecked(out[2] = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3);
  unchecked(out[3] = 0.5 * (y3 - y0) + 1.5 * (y1 - y2));
  return out;
}