import type { AppState } from '../types/state';

// Transport
export const selectBpm = (state: AppState) => state.transport.bpm;
export const selectIsPlaying = (state: AppState) => state.transport.isPlaying;
export const selectCurrentStep = (state: AppState) => state.transport.currentStep;

// UI
export const selectSelectedTrackId = (state: AppState) => state.ui.selectedTrackId;
export const selectSelectedLfoIndex = (state: AppState) => state.ui.selectedLfoIndex;
export const selectVisualizerMode = (state: AppState) => state.ui.visualizerMode;

// Tracks
export const selectAllTracks = (state: AppState) => state.tracks;
export const selectTrackById = (state: AppState, id: number) => state.tracks[id];

export const selectSelectedTrack = (state: AppState) => state.tracks[state.ui.selectedTrackId];

// Derived Selectors
export const selectSelectedTrackLfo = (state: AppState) => {
    const track = selectSelectedTrack(state);
    if (!track) return null;
    return track.lfos[state.ui.selectedLfoIndex];
};

export const selectIsAnySolo = (state: AppState) => {
    return state.tracks.some(t => t.triggers.soloed && t.type !== 'automation');
};