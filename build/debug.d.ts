/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/interpolateCubic
 * @param y0 `f32`
 * @param y1 `f32`
 * @param y2 `f32`
 * @param y3 `f32`
 * @param t `f32`
 * @returns `f32`
 */
export declare function interpolateCubic(y0: number, y1: number, y2: number, y3: number, t: number): number;
/**
 * assembly/index/applyGainRamp
 * @param data `~lib/typedarray/Float32Array`
 * @param startGain `f32`
 * @param endGain `f32`
 */
export declare function applyGainRamp(data: Float32Array, startGain: number, endGain: number): void;
/**
 * assembly/index/computeHermiteCoefficients
 * @param y0 `f32`
 * @param y1 `f32`
 * @param y2 `f32`
 * @param y3 `f32`
 * @returns `~lib/typedarray/Float32Array`
 */
export declare function computeHermiteCoefficients(y0: number, y1: number, y2: number, y3: number): Float32Array;
