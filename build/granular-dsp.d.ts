declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * assembly/granular-dsp/init
   */
  export function init(): void;
  /**
   * assembly/granular-dsp/setSafetyLimit
   * @param limit `i32`
   */
  export function setSafetyLimit(limit: number): void;
  /**
   * assembly/granular-dsp/setTrackBuffer
   * @param trackId `i32`
   * @param byteOffset `i32`
   * @param lengthSamples `i32`
   */
  export function setTrackBuffer(trackId: number, byteOffset: number, lengthSamples: number): void;
  /**
   * assembly/granular-dsp/pushNote
   * @param trackId `i32`
   * @param startTime `f64`
   * @param duration `f64`
   * @param basePosition `f32`
   * @param scanSpeed `f32`
   * @param windowStart `f32`
   * @param windowEnd `f32`
   * @param density `f32`
   * @param grainSize `f32`
   * @param overlap `f32`
   * @param pitch `f32`
   * @param velocity `f32`
   * @param spray `f32`
   * @param cleanMode `i32`
   * @param edgeCrunch `f32`
   * @param orbit `f32`
   * @param resetOnBar `i32`
   * @param resetOnTrig `i32`
   */
  export function pushNote(trackId: number, startTime: number, duration: number, basePosition: number, scanSpeed: number, windowStart: number, windowEnd: number, density: number, grainSize: number, overlap: number, pitch: number, velocity: number, spray: number, cleanMode: number, edgeCrunch: number, orbit: number, resetOnBar: number, resetOnTrig: number): void;
  /**
   * assembly/granular-dsp/process
   * @param currentTime `f64`
   * @param sampleRate `f64`
   * @param frameCount `i32`
   * @returns `i32`
   */
  export function process(currentTime: number, sampleRate: number, frameCount: number): number;
  /**
   * assembly/granular-dsp/stopAll
   */
  export function stopAll(): void;
  /**
   * assembly/granular-dsp/stopTrack
   * @param trackId `i32`
   */
  export function stopTrack(trackId: number): void;
  /**
   * assembly/granular-dsp/getGrainCount
   * @returns `i32`
   */
  export function getGrainCount(): number;
  /**
   * assembly/granular-dsp/getOutputBase
   * @returns `i32`
   */
  export function getOutputBase(): number;
  /**
   * assembly/granular-dsp/getTrackBuffersBase
   * @returns `i32`
   */
  export function getTrackBuffersBase(): number;
  /**
   * assembly/granular-dsp/allocateTrackBuffer
   * @param trackId `i32`
   * @param lengthSamples `i32`
   * @returns `i32`
   */
  export function allocateTrackBuffer(trackId: number, lengthSamples: number): number;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
