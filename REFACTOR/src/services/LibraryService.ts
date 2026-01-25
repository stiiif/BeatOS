import JSZip from 'jszip';
import type { TrackState } from '../types/state';
import { AudioUtils } from '../utils/audio-utils';
import { audioContext } from '../core/AudioContext';
import { audioEngine } from '../core/AudioEngine';

const STORAGE_KEY = 'beatos_track_library';

export interface SavedTrack extends Omit<TrackState, 'sample'> {
    timestamp: string;
    sampleName?: string; 
}

export class LibraryService {
    static getSavedTracks(): SavedTrack[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load library', e);
            return [];
        }
    }

    static saveTrackToLibrary(track: TrackState): void {
        const library = this.getSavedTracks();
        
        const savedItem: SavedTrack = {
            ...track,
            timestamp: new Date().toISOString(),
            sampleName: track.sample?.name
        };
        
        library.push(savedItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    }

    static deleteTrack(index: number): void {
        const library = this.getSavedTracks();
        if (index >= 0 && index < library.length) {
            library.splice(index, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        }
    }

    static async exportTrack(track: TrackState): Promise<void> {
        const zip = new JSZip();
        
        const trackData = {
            ...track,
            hasSample: false,
            sampleName: track.sample?.name
        };

        if (track.sample && track.type === 'granular') {
            const buffer = audioEngine.getBuffer(track.id);
            if (buffer) {
                const wav = AudioUtils.audioBufferToWav(buffer);
                zip.file('sample.wav', wav);
                trackData.hasSample = true;
            }
        }

        zip.file('track.json', JSON.stringify(trackData, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = track.name.replace(/[^a-z0-9]/gi, '_');
        a.download = `${name}.beattrk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static async importTrack(file: File): Promise<{ track: Partial<TrackState>, buffer?: AudioBuffer }> {
        const zip = await JSZip.loadAsync(file);
        
        const jsonFile = zip.file('track.json');
        if (!jsonFile) throw new Error('Invalid track file');
        
        const jsonStr = await jsonFile.async('string');
        const data = JSON.parse(jsonStr); 
        
        let buffer: AudioBuffer | undefined;
        const sampleFile = zip.file('sample.wav');
        
        if (sampleFile) {
            const arrayBuffer = await sampleFile.async('arraybuffer');
            const ctx = audioContext.getContext();
            buffer = await ctx.decodeAudioData(arrayBuffer);
        }

        return {
            track: data,
            buffer
        };
    }
}