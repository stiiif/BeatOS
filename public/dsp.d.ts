/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/init
 */
export declare function init(): void;
/**
 * assembly/index/allocateBuffer
 * @param size `i32`
 * @returns `usize`
 */
export declare function allocateBuffer(size: number): number;
/**
 * assembly/index/setTrackBuffer
 * @param trackId `i32`
 * @param ptr `usize`
 * @param length `i32`
 */
export declare function setTrackBuffer(trackId: number, ptr: number, length: number): void;
/**
 * assembly/index/spawnGrain
 * @param trackId `i32`
 * @param position `f32`
 * @param durationSamples `i32`
 * @param pitch `f32`
 * @param velocity `f32`
 * @param spray `f32`
 * @param offset `i32`
 */
export declare function spawnGrain(trackId: number, position: number, durationSamples: number, pitch: number, velocity: number, spray: number, offset: number): void;
/**
 * assembly/index/process
 * @param outputPtr `usize`
 * @param frameCount `i32`
 */
export declare function process(outputPtr: number, frameCount: number): void;
/**
 * assembly/index/stopAll
 */
export declare function stopAll(): void;
