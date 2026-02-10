/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/granular/init
 * @param sr `f64`
 */
export declare function init(sr: number): void;
/**
 * assembly/granular/spawnGrain
 * @param trackId `i32`
 * @param bufferPtr `usize`
 * @param bufferLen `i32`
 * @param position `f64`
 * @param grainLenSamples `i32`
 * @param pitch `f64`
 * @param velocity `f32`
 * @param cleanMode `bool`
 * @param edgeCrunch `f32`
 * @param orbit `f64`
 */
export declare function spawnGrain(trackId: number, bufferPtr: number, bufferLen: number, position: number, grainLenSamples: number, pitch: number, velocity: number, cleanMode: boolean, edgeCrunch: number, orbit: number): void;
/**
 * assembly/granular/processAudioBlock
 * @param outputPtr `usize`
 * @param frameCount `i32`
 * @param activeVoiceCount `i32`
 */
export declare function processAudioBlock(outputPtr: number, frameCount: number, activeVoiceCount: number): void;
/**
 * assembly/granular/getActiveVoiceCount
 * @returns `i32`
 */
export declare function getActiveVoiceCount(): number;
