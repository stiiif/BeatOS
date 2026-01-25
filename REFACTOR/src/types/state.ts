import { TrackParams, LFO, InstrumentType } from './audio';

export interface TrackState {
    id: number;
    name: string;
    type: InstrumentType;
    // Arrays are cleaner than TypedArrays for React/Redux-like state, 
    // but we preserve the data structure logic
    steps: number[]; // 0-9 velocity
    microtiming: number[]; // +/- ms offsets
    params: TrackParams;
    lfos: LFO[];
    
    // UI Triggers & Flags
    triggers: {
        muted: boolean;
        soloed: boolean;
        locked: boolean;
        ignoreRandom: boolean;
    };
    
    // Automation state
    chokeGroup: number;
    
    // Sample Data (Metadata only in state, buffer in Service)
    sample?: {
        name: string;
        duration: number;
        // buffer is NOT stored in state to keep it serializable
    };
}

export interface TransportState {
    bpm: number;
    isPlaying: boolean;
    currentStep: number;
    totalSteps: number;
}

export interface UIState {
    selectedTrackId: number;
    selectedLfoIndex: number;
    visualizerMode: 'wave' | 'spectrum';
    activeModal: 'library' | 'search' | null;
}

export interface AppState {
    tracks: TrackState[];
    transport: TransportState;
    ui: UIState;
}