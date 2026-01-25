// The "Source of Truth" for DOM binding.
// The UI components will import this to know what IDs to look for.
export const DOM_IDS = {
    TRANSPORT: {
        PLAY: 'playBtn',
        STOP: 'stopBtn',
        BPM_INPUT: 'bpmInput',
        GRAIN_MONITOR: 'grainMonitor',
        MAX_GRAINS: 'maxGrainsInput'
    },
    GLOBAL: {
        SNAPSHOT: 'snapshotBtn',
        RND_CHOKE: 'rndChokeBtn',
        RND_ALL_PAT: 'randomizeAllPatternsBtn',
        RND_ALL_PRM: 'randAllParamsBtn',
        CLEAR_TRACK: 'clearTrackBtn',
        SAVE: 'saveBtn',
        LOAD: 'loadBtn'
    },
    TRACK_HEADER: {
        INDICATOR: 'trackIndicator',
        NUM: 'currentTrackNum',
        LABEL: 'trackTypeLabel',
        GROUP: 'trackGroupLabel'
    },
    CONTROLS: {
        GRANULAR_CONTAINER: 'granularControls',
        DRUM_CONTAINER: 'simpleDrumControls',
        AUTO_CONTAINER: 'automationControls',
        LFO_CONTAINER: 'lfoSection',
        AUTO_SPEED: 'autoSpeedSelect'
    },
    VISUALIZER: {
        MAIN: 'visualizer',
        BUFFER: 'bufferDisplay',
        BTN_WAVE: 'scopeBtnWave',
        BTN_SPEC: 'scopeBtnSpec',
        BTN_TRIM: 'scopeBtnTrim'
    },
    GRID: {
        CONTAINER: 'matrixContainer',
        HEADERS: 'stepHeaders'
    }
} as const;