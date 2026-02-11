declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * assembly/index/init
   */
  export function init(): void;
  /**
   * assembly/index/allocateBuffer
   * @param trackId `i32`
   * @param length `i32`
   * @returns `usize`
   */
  export function allocateBuffer(trackId: number, length: number): number;
  /**
   * assembly/index/getOutputBufferPtr
   * @returns `usize`
   */
  export function getOutputBufferPtr(): number;
  /**
   * assembly/index/spawnGrain
   * @param trackId `i32`
   * @param position `f32`
   * @param grainSizeSec `f32`
   * @param pitch `f32`
   * @param velocity `f32`
   * @param spray `f32`
   * @param sampleRate `f32`
   */
  export function spawnGrain(trackId: number, position: number, grainSizeSec: number, pitch: number, velocity: number, spray: number, sampleRate: number): void;
  /**
   * assembly/index/process
   * @param sampleRate `f32`
   */
  export function process(sampleRate: number): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
