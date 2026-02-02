// BeatOS Shared Memory Definition
// Defines the binary layout for lock-free communication between Main Thread and AudioWorklet.

export const MEMORY_LAYOUT = {
    // --- CONTROL BUFFER (Int32Array) ---
    COUNTERS_SIZE: 16,
    IDX_STATE: 0,           // 0 = Stop, 1 = Play
    IDX_CURRENT_STEP: 1,    // Current Sequencer Step (0-63)
    IDX_BPM: 2,             // Beats Per Minute
    IDX_SAMPLE_RATE: 3,     // Audio Context Sample Rate
    IDX_TOTAL_SAMPLES: 4,   // Absolute time in samples (for future Song Mode)
    
    // --- TRACK BUFFER (Uint8Array) ---
    // Layout: [Step0, Step1, ... Step63] * 32 Tracks
    STEPS_PER_TRACK: 64,
    MAX_TRACKS: 32,
    
    // --- PARAM BUFFER (Float32Array) ---
    // Layout: [Param0, ... Param23] * 32 Tracks
    PARAMS_PER_TRACK: 24,   // Increased to 24 to accommodate Sends/LFOs
    
    // Parameter Indices
    P_VOL: 0,
    P_PAN: 1,
    P_PITCH: 2,
    P_DECAY: 3,      // Grain Size (Granular) or Decay (Drum)
    P_POSITION: 4,   // Grain Pos (Granular) or Tune (Drum)
    P_DENSITY: 5,    // Density (Granular) or Snap (Snare)
    P_SPRAY: 6,      // Spray (Granular)
    P_FILTER: 7,     // Lowpass Cutoff
    P_RES: 8,        // Resonance
    P_DRIVE: 9,      // Saturation Amount
    P_TYPE: 10,      // Engine Type: 0=Granular, 1=Kick, 2=Snare, 3=Hat, 4=Sample
    
    // Reserved for Future Features (Phase C+)
    P_SEND_A: 11,
    P_SEND_B: 12,
    P_LFO1_RATE: 13,
    P_LFO1_AMT: 14,
    P_LFO2_RATE: 15,
    P_LFO2_AMT: 16,
    P_ATTACK: 17,    // Amp Envelope Attack
    P_RELEASE: 18,   // Amp Envelope Release
    
    // --- METER BUFFER (Float32Array) ---
    // Layout: [LeftRMS, RightRMS] * 32 Tracks + [SendAL, SendAR] + [SendBL, SendBR]
    METERS_PER_TRACK: 2,
    METER_OFFSET_SEND_A: 32 * 2, // Index for Send A Meters
    METER_OFFSET_SEND_B: 33 * 2  // Index for Send B Meters
};

export class BeatOSMemory {
    constructor() {
        const hasSAB = typeof SharedArrayBuffer !== 'undefined';
        
        if (!hasSAB) {
            console.warn("SharedArrayBuffer is not available. Falling back to ArrayBuffer. Audio/Visual sync will be broken.");
        }

        const BufferType = hasSAB ? SharedArrayBuffer : ArrayBuffer;

        // 1. Control Buffer (State & Clock)
        this.controlBuffer = new BufferType(MEMORY_LAYOUT.COUNTERS_SIZE * 4); // Bytes
        this.controlView = new Int32Array(this.controlBuffer);
        
        // 2. Track Buffer (Pattern Grid)
        const trackBufferSize = MEMORY_LAYOUT.MAX_TRACKS * MEMORY_LAYOUT.STEPS_PER_TRACK;
        this.trackBuffer = new BufferType(trackBufferSize);
        this.trackView = new Uint8Array(this.trackBuffer);
        
        // 3. Param Buffer (Knobs & Automation)
        const paramBufferSize = MEMORY_LAYOUT.MAX_TRACKS * MEMORY_LAYOUT.PARAMS_PER_TRACK * 4;
        this.paramBuffer = new BufferType(paramBufferSize);
        this.paramView = new Float32Array(this.paramBuffer);
        
        // 4. Meter Buffer (Visual Feedback)
        // 32 Tracks + 2 Sends = 34 Stereo Pairs
        const meterBufferSize = (MEMORY_LAYOUT.MAX_TRACKS + 2) * MEMORY_LAYOUT.METERS_PER_TRACK * 4;
        this.meterBuffer = new BufferType(meterBufferSize);
        this.meterView = new Float32Array(this.meterBuffer);
        
        this.initDefaults();
    }
    
    initDefaults() {
        // Set default values to avoid silence on startup
        this.controlView[MEMORY_LAYOUT.IDX_BPM] = 120;
        this.controlView[MEMORY_LAYOUT.IDX_SAMPLE_RATE] = 44100;
        
        // Init Params (Default Volume 0.8, Pan 0)
        for (let i = 0; i < MEMORY_LAYOUT.MAX_TRACKS; i++) {
            const offset = i * MEMORY_LAYOUT.PARAMS_PER_TRACK;
            this.paramView[offset + MEMORY_LAYOUT.P_VOL] = 0.8;
            this.paramView[offset + MEMORY_LAYOUT.P_PAN] = 0.0;
            this.paramView[offset + MEMORY_LAYOUT.P_PITCH] = 1.0;
            this.paramView[offset + MEMORY_LAYOUT.P_FILTER] = 20000; // Open filter
        }
    }
    
    getBuffers() {
        return {
            control: this.controlBuffer,
            tracks: this.trackBuffer,
            params: this.paramBuffer,
            meters: this.meterBuffer
        };
    }
}