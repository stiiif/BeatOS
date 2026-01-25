import JSZip from 'jszip';
import { store } from '../state/Store';
import { AppState } from '../types/state';
import { AudioUtils } from '../utils/audio-utils';
import { audioContext } from '../core/AudioContext';
import { ActionTypes } from '../state/actions';

export class StorageService {
    
    /**
     * Save the entire project to a .beatos file (ZIP)
     * @param bufferGetter A function that returns the AudioBuffer for a track ID
     */
    static async saveProject(bufferGetter: (trackId: number) => AudioBuffer | null): Promise<void> {
        const state = store.getState();
        const zip = new JSZip();
        
        // 1. Prepare clean JSON structure (matching legacy format where possible)
        const tracksData = state.tracks.map(t => {
            const trackObj: any = {
                id: t.id,
                name: t.sample?.name || t.name, // Use sample name if available
                type: t.type,
                params: t.params,
                steps: t.steps,
                microtiming: t.microtiming,
                muted: t.triggers.muted,
                soloed: t.triggers.soloed,
                stepLock: t.triggers.locked,
                ignoreRandom: t.triggers.ignoreRandom,
                lfos: t.lfos,
                chokeGroup: t.chokeGroup,
                samplePath: null
            };

            // 2. Embed Sample if it exists
            // We use the bufferGetter callback because Buffers are not in the Store
            if (t.sample && t.type === 'granular') {
                const buffer = bufferGetter(t.id);
                if (buffer) {
                    try {
                        const safeName = t.sample.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        const filename = `samples/${t.id}_${safeName}.wav`;
                        
                        // Encode to WAV
                        const wavBuffer = AudioUtils.audioBufferToWav(buffer);
                        zip.file(filename, wavBuffer);
                        
                        trackObj.samplePath = filename;
                        trackObj.sampleName = t.sample.name;
                    } catch (e) {
                        console.error(`Failed to pack sample for track ${t.id}`, e);
                    }
                }
            }
            
            return trackObj;
        });

        const projectData = {
            version: "2.0",
            bpm: state.transport.bpm,
            tracks: tracksData
        };

        zip.file("preset.json", JSON.stringify(projectData, null, 2));

        // 3. Generate Blob and Download
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        a.download = `project_${dateStr}.beatos`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Load a project from a file
     * @param file .beatos (zip) or legacy .json file
     * @param bufferSetter Callback to load a decoded buffer into the Audio Engine
     */
    static async loadProject(
        file: File, 
        bufferSetter: (trackId: number, buffer: AudioBuffer) => void
    ): Promise<void> {
        const isZip = file.name.endsWith('.beatos') || file.name.endsWith('.zip');

        if (isZip) {
            await this.loadZipProject(file, bufferSetter);
        } else {
            // Legacy JSON support (no samples)
            await this.loadJsonProject(file);
        }
    }

    private static async loadZipProject(file: File, bufferSetter: (id: number, buf: AudioBuffer) => void) {
        try {
            const zip = await JSZip.loadAsync(file);
            
            // 1. Load JSON
            const jsonFile = zip.file("preset.json");
            if (!jsonFile) throw new Error("Invalid .beatos file: missing preset.json");
            
            const jsonStr = await jsonFile.async("string");
            const data = JSON.parse(jsonStr); // Project Data

            // 2. Dispatch State Update
            // Map the file data back to our TrackState structure
            const tracks = this.mapLoadedDataToState(data.tracks);
            
            store.dispatch({ 
                type: ActionTypes.LOAD_STATE, 
                payload: { 
                    tracks, 
                    transport: { bpm: data.bpm } 
                } 
            });

            // 3. Load Samples
            const ctx = audioContext.getContext();
            
            for (const tData of data.tracks) {
                if (tData.samplePath) {
                    const sampleFile = zip.file(tData.samplePath);
                    if (sampleFile) {
                        const arrayBuffer = await sampleFile.async("arraybuffer");
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        
                        // Inject into Audio Engine (not Store)
                        bufferSetter(tData.id, audioBuffer);
                        
                        // Update Store with sample metadata if it wasn't in the JSON
                        // (Though LOAD_STATE should have handled it via mapLoadedDataToState)
                    }
                }
            }

        } catch (e) {
            console.error("Failed to load project:", e);
            alert("Failed to load project file.");
        }
    }

    private static async loadJsonProject(file: File) {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    
                    // Handle structure differences (e.g. tracks array vs root object)
                    const tracksData = data.tracks || (Array.isArray(data) ? data : []);
                    const tracks = this.mapLoadedDataToState(tracksData);
                    
                    store.dispatch({
                        type: ActionTypes.LOAD_STATE,
                        payload: {
                            tracks,
                            transport: { bpm: data.bpm || 120 }
                        }
                    });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }

    // Helper to ensure loaded data matches strict TrackState interface
    private static mapLoadedDataToState(loadedTracks: any[]): AppState['tracks'] {
        // We need to merge with default state to ensure no missing properties
        // This is a simplified version; in a full app we'd use the factory from trackReducer
        // For now, we assume the loaded data matches closely or we trust strict typing later
        return loadedTracks.map(t => ({
            id: t.id,
            name: t.name || `Track ${t.id}`,
            type: t.type || 'granular',
            steps: t.steps || [],
            microtiming: t.microtiming || [],
            params: t.params, // Assume matching Params interface
            lfos: t.lfos || [],
            triggers: {
                muted: !!t.muted,
                soloed: !!t.soloed,
                locked: !!t.stepLock,
                ignoreRandom: !!t.ignoreRandom // Handle legacy key mismatch if any
            },
            chokeGroup: t.chokeGroup || 0,
            sample: t.sampleName ? { name: t.sampleName, duration: 0 } : undefined
        }));
    }
}