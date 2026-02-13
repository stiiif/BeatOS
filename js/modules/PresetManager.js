// Preset Manager Module
import { NUM_LFOS } from '../utils/constants.js';
import { AudioUtils } from '../utils/AudioUtils.js';
import { Modulator } from './modulators/Modulator.js';

export class PresetManager {
    // --- SAVE LOGIC ---
    async savePreset(tracks, bpm) {
        // Create new ZIP
        const zip = new JSZip();
        
        // Prepare track data for JSON
        const tracksData = [];
        
        for(let i=0; i<tracks.length; i++) {
            const t = tracks[i];
            const trackObj = {
                id: t.id, 
                params: t.params, 
                steps: t.steps, 
                muted: t.muted, 
                soloed: t.soloed, 
                stepLock: t.stepLock,
                lfos: t.lfos.map(l => l.serialize ? l.serialize() : { 
                    wave: l.wave, 
                    rate: l.rate, 
                    amount: l.amount, 
                    targets: l.targets
                }),
                samplePath: null // Will be filled if custom sample exists
            };

            // If track has a custom sample, add it to the ZIP
            if (t.customSample && t.buffer) {
                try {
                    // 1. Create a safe filename
                    const safeName = t.customSample.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const filename = `samples/${i}_${safeName}.wav`;
                    
                    // 2. Convert AudioBuffer to WAV ArrayBuffer using shared Utility
                    const wavBuffer = AudioUtils.audioBufferToWav(t.buffer);
                    
                    // 3. Add to ZIP
                    zip.file(filename, wavBuffer);
                    
                    // 4. Update JSON reference
                    trackObj.samplePath = filename;
                    trackObj.sampleName = t.customSample.name; // Keep original name for display
                    
                } catch (e) {
                    console.error(`Failed to pack sample for track ${t.id}:`, e);
                }
            }
            tracksData.push(trackObj);
        }

        const presetData = {
            bpm: bpm,
            version: "2.1", // Bump version for .beatos format with multi-LFO targets
            tracks: tracksData
        };

        // Add JSON to ZIP
        zip.file("preset.json", JSON.stringify(presetData, null, 2));

        // Generate the .beatos file
        zip.generateAsync({type:"blob"}).then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a'); 
            a.href = url;
            a.download = `project_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.beatos`;
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a); 
            URL.revokeObjectURL(url);
        });
    }

    // --- LOAD LOGIC ---
    loadPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine) {
        if (!file) return;

        // Check file extension to decide handling
        const isZip = file.name.endsWith('.beatos') || file.name.endsWith('.zip');

        if (isZip) {
            this.loadZipPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine);
        } else {
            // Fallback for legacy .json files
            this.loadJsonPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine);
        }
    }

    async loadZipPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine) {
        try {
            const zip = await JSZip.loadAsync(file);
            
            // 1. Load preset.json
            if (!zip.file("preset.json")) throw new Error("Invalid .beatos file: missing preset.json");
            const jsonStr = await zip.file("preset.json").async("string");
            const data = JSON.parse(jsonStr);
            
            await this.applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, zip);

        } catch (err) {
            console.error(err);
            alert("Failed to load .beatos file: " + err.message);
        }
    }

    loadJsonPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, null);
            } catch (err) { 
                console.error(err); 
                alert("Failed to load JSON preset."); 
            }
        };
        reader.readAsText(file);
    }

    // Shared application logic
    async applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, zipInstance) {
        if(!data.tracks || !Array.isArray(data.tracks)) throw new Error("Invalid preset structure");
        
        const bpm = data.bpm || 120;
        const audioCtx = audioEngine.getContext();

        // Ensure we have enough tracks
        while(tracks.length < data.tracks.length) addTrackCallback();
        
        for (let i = 0; i < data.tracks.length; i++) {
            const trackData = data.tracks[i];
            if (i >= tracks.length) break;
            
            const t = tracks[i];
            t.params = { ...t.params, ...trackData.params };
            t.steps = [...trackData.steps];
            t.muted = !!trackData.muted; t.soloed = !!trackData.soloed;
            t.stepLock = !!trackData.stepLock;
            
            if (trackData.lfos) trackData.lfos.forEach((lData, lIdx) => {
                if(lIdx < NUM_LFOS) {
                    // Use deserialize for full modulator type support
                    if (lData.type !== undefined) {
                        t.lfos[lIdx] = Modulator.deserialize(lData);
                    } else {
                        // Legacy LFO data
                        t.lfos[lIdx].wave = lData.wave; 
                        t.lfos[lIdx].rate = lData.rate;
                        t.lfos[lIdx].amount = lData.amount; 
                        if (lData.targets) {
                            t.lfos[lIdx].targets = [...lData.targets];
                        } else if (lData.target) {
                            t.lfos[lIdx].targets = [lData.target];
                        } else {
                            t.lfos[lIdx].targets = [];
                        }
                    }
                }
            });

            // HANDLE SAMPLES
            // Case A: ZIP file with embedded sample path
            if (zipInstance && trackData.samplePath && audioCtx) {
                try {
                    const sampleFile = zipInstance.file(trackData.samplePath);
                    if (sampleFile) {
                        const arrayBuffer = await sampleFile.async("arraybuffer");
                        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                        
                        t.customSample = {
                            name: trackData.sampleName || "Imported Sample",
                            buffer: audioBuffer,
                            duration: audioBuffer.duration
                        };
                        t.buffer = audioBuffer;
                        t.needsSampleReload = false;
                    }
                } catch (e) {
                    console.error(`Failed to load sample ${trackData.samplePath}`, e);
                }
            } 
            // Case B: Legacy JSON with base64 (from previous implementation attempt, if any)
            else if (trackData.hasCustomSample && trackData.customSampleData && audioCtx) {
                try {
                    const sampleInfo = trackData.customSampleData;
                    const binaryString = window.atob(sampleInfo.data);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let j = 0; j < len; j++) bytes[j] = binaryString.charCodeAt(j);
                    
                    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
                    t.customSample = {
                        name: sampleInfo.name,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration
                    };
                    t.buffer = audioBuffer;
                } catch (e) { console.error("Legacy sample load failed", e); }
            }

            updateTrackStateUICallback(i);
            // Refresh grid
            for(let s=0; s<t.steps.length; s++) {
                 const btn = matrixStepElements[i][s];
                 if(t.steps[s]) btn.classList.add('active'); else btn.classList.remove('active');
            }
        }
        
        selectTrackCallback(selectedTrackIndex);
        if (audioEngine.onBpmChange) audioEngine.onBpmChange(bpm);
    }
}