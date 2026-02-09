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
 * assembly/index/process
 * @param outputPtr `usize`
 * @param limit `i32`
 */
export declare function process(outputPtr: number, limit: number): void;
/**
 * assembly/index/noteOn
 * @param trackId `i32`
 * @param position `f32`
 * @param grainSize `f32`
 * @param pitch `f32`
 * @param gain `f32`
 * @param pan `f32`
 * @param spray `f32`
 * @param orbit `f32`
 * @param edgeCrunch `f32`
 * @param cleanMode `bool`
 */
export declare function noteOn(trackId: number, position: number, grainSize: number, pitch: number, gain: number, pan: number, spray: number, orbit: number, edgeCrunch: number, cleanMode: boolean): void;
/**
 * assembly/index/stopAll
 */
export declare function stopAll(): void;
