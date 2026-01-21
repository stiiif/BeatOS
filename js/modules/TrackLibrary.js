// Track Library Module - Manages saved track presets
import { NUM_LFOS } from '../utils/constants.js';

export class TrackLibrary {
    constructor() {
        this.savedTracks = this.loadLibrary();
    }

    // Load library from localStorage
    loadLibrary() {
        try {
            const stored = localStorage.getItem('beatos_track_library');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load track library:', e);
            return [];
        }
    }

    // Save library to localStorage
    saveLibrary() {
        try {
            localStorage.setItem('beatos_track_library', JSON.stringify(this.savedTracks));
        } catch (e) {
            console.error('Failed to save track library:', e);
            alert('Failed to save track library');
        }
    }

    // Save current track to library
    saveTrack(track, trackName = null) {
        const name = trackName || prompt('Enter a name for this track:', `Track ${track.id}`);
        if (!name) return null;

        const trackData = {
            name: name,
            timestamp: new Date().toISOString(),
            id: track.id,
            params: { ...track.params },
            steps: [...track.steps],
            muted: track.muted,
            soloed: track.soloed,
            stepLock: track.stepLock,
            lfos: track.lfos.map(l => ({ 
                wave: l.wave, 
                rate: l.rate, 
                amount: l.amount, 
                target: l.target 
            })),
            // Store custom sample info if present
            customSample: track.customSample ? {
                name: track.customSample.name,
                duration: track.customSample.duration
            } : null
        };

        this.savedTracks.push(trackData);
        this.saveLibrary();
        return trackData;
    }

    // Load track data into a track object
    loadTrackInto(savedTrackIndex, targetTrack) {
        if (savedTrackIndex < 0 || savedTrackIndex >= this.savedTracks.length) {
            return false;
        }

        const trackData = this.savedTracks[savedTrackIndex];
        
        // Copy parameters
        targetTrack.params = { ...targetTrack.params, ...trackData.params };
        targetTrack.steps = [...trackData.steps];
        targetTrack.muted = !!trackData.muted;
        targetTrack.soloed = !!trackData.soloed;
        targetTrack.stepLock = !!trackData.stepLock;

        // Copy LFOs
        if (trackData.lfos) {
            trackData.lfos.forEach((lData, lIdx) => {
                if (lIdx < NUM_LFOS) {
                    targetTrack.lfos[lIdx].wave = lData.wave;
                    targetTrack.lfos[lIdx].rate = lData.rate;
                    targetTrack.lfos[lIdx].amount = lData.amount;
                    targetTrack.lfos[lIdx].target = lData.target;
                }
            });
        }

        // Store custom sample info (buffer will need to be reloaded separately)
        if (trackData.customSample) {
            targetTrack.customSample = trackData.customSample;
            targetTrack.needsSampleReload = true;
        }

        return true;
    }

    // Get list of saved tracks
    getSavedTracks() {
        return this.savedTracks;
    }

    // Delete a saved track
    deleteTrack(index) {
        if (index >= 0 && index < this.savedTracks.length) {
            this.savedTracks.splice(index, 1);
            this.saveLibrary();
            return true;
        }
        return false;
    }

    // Export track to file
    exportTrack(index) {
        if (index < 0 || index >= this.savedTracks.length) return;
        
        const trackData = this.savedTracks[index];
        const json = JSON.stringify(trackData, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `track_${trackData.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import track from file
    importTrack(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const trackData = JSON.parse(e.target.result);
                if (!trackData.params || !trackData.steps) {
                    throw new Error("Invalid track file");
                }
                this.savedTracks.push(trackData);
                this.saveLibrary();
                if (callback) callback(true, trackData);
            } catch (err) {
                console.error(err);
                alert("Failed to import track.");
                if (callback) callback(false);
            }
        };
        reader.readAsText(file);
    }
}
