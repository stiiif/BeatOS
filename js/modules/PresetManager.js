// Preset Manager Module
import { NUM_LFOS } from '../utils/constants.js';
import { AudioUtils } from '../utils/AudioUtils.js';

export class PresetManager {
    // --- SAVE LOGIC ---
    async savePreset(tracks, bpm) {
        // Create new ZIP
        const zip = new JSZip();

        // Prepare track data for JSON
        const tracksData = [];

        for (let i = 0; i < tracks.length; i++) {
            const t = tracks[i];

            const trackObj = {
                id: t.id,
                type: t.type, // ✅ Save track type
                params: t.params,

                // ✅ FIX: Explicitly convert typed arrays to regular arrays for JSON
                steps: Array.from(t.steps),
                microtiming: Array.from(t.microtiming || new Float32Array(64)),

                // Track state
                muted: t.muted,
                soloed: t.soloed,
                stepLock: t.stepLock,
                ignoreRandom: t.ignoreRandom || false,
                chokeGroup: t.chokeGroup || 0,

                // Automation specific
                clockDivider: t.clockDivider || 1,

                // LFOs
                lfos: t.lfos.map(l => ({
                    wave: l.wave,
                    rate: l.rate,
                    amount: l.amount,
                    target: l.target
                })),

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
            version: "2.0",
            tracks: tracksData
        };

        // Add JSON to ZIP
        zip.file("preset.json", JSON.stringify(presetData, null, 2));

        // Generate the .beatos file
        zip.generateAsync({ type: "blob" }).then(function (content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.beatos`;
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
        if (!data.tracks || !Array.isArray(data.tracks)) throw new Error("Invalid preset structure");

        const bpm = data.bpm || 120;
        const audioCtx = audioEngine.getContext();

        // Ensure we have enough tracks
        while (tracks.length < data.tracks.length) addTrackCallback();

        for (let i = 0; i < data.tracks.length; i++) {
            const trackData = data.tracks[i];
            if (i >= tracks.length) break;

            const t = tracks[i];

            // Restore parameters
            t.params = { ...t.params, ...trackData.params };

            // ✅ FIX: Properly handle steps restoration
            if (trackData.steps) {
                if (trackData.steps instanceof Uint8Array) {
                    // Already a Uint8Array
                    t.steps = trackData.steps;
                } else if (Array.isArray(trackData.steps)) {
                    // Convert array to Uint8Array
                    t.steps = new Uint8Array(trackData.steps);
                } else if (typeof trackData.steps === 'object' && trackData.steps !== null) {
                    // Handle case where it's serialized as object {0: 0, 1: 2, ...}
                    const stepsArray = Object.values(trackData.steps);
                    t.steps = new Uint8Array(stepsArray);
                } else {
                    console.warn(`Track ${i}: Invalid steps format, resetting to empty`);
                    t.steps = new Uint8Array(64).fill(0);
                }
            } else {
                t.steps = new Uint8Array(64).fill(0);
            }

            // ✅ FIX: Properly handle microtiming restoration (similar issue)
            if (trackData.microtiming) {
                if (trackData.microtiming instanceof Float32Array) {
                    t.microtiming = trackData.microtiming;
                } else if (Array.isArray(trackData.microtiming)) {
                    t.microtiming = new Float32Array(trackData.microtiming);
                } else if (typeof trackData.microtiming === 'object' && trackData.microtiming !== null) {
                    const microArray = Object.values(trackData.microtiming);
                    t.microtiming = new Float32Array(microArray);
                } else {
                    t.microtiming = new Float32Array(64).fill(0);
                }
            } else {
                t.microtiming = new Float32Array(64).fill(0);
            }

            // Restore track state
            t.muted = !!trackData.muted;
            t.soloed = !!trackData.soloed;
            t.stepLock = !!trackData.stepLock;

            // ✅ FIX: Restore track type (important!)
            if (trackData.type) {
                t.type = trackData.type;
            }

            // ✅ FIX: Restore clock divider for automation tracks
            if (trackData.clockDivider) {
                t.clockDivider = trackData.clockDivider;
            }

            // ✅ FIX: Restore choke group
            if (trackData.chokeGroup !== undefined) {
                t.chokeGroup = trackData.chokeGroup;
            }

            // ✅ FIX: Restore ignore random flag
            if (trackData.ignoreRandom !== undefined) {
                t.ignoreRandom = trackData.ignoreRandom;
            }

            // Restore LFOs
            if (trackData.lfos) {
                trackData.lfos.forEach((lData, lIdx) => {
                    if (lIdx < NUM_LFOS) {
                        t.lfos[lIdx].wave = lData.wave;
                        t.lfos[lIdx].rate = lData.rate;
                        t.lfos[lIdx].amount = lData.amount;
                        t.lfos[lIdx].target = lData.target;
                    }
                });
            }

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

                        // ✅ FIX: Regenerate RMS map
                        t.rmsMap = audioEngine.analyzeBuffer(audioBuffer);
                    }
                } catch (e) {
                    console.error(`Failed to load sample ${trackData.samplePath}`, e);
                }
            }
            // Case B: Legacy JSON with base64
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
                    t.rmsMap = audioEngine.analyzeBuffer(audioBuffer);
                } catch (e) {
                    console.error("Legacy sample load failed", e);
                }
            }

            updateTrackStateUICallback(i);

            // Refresh grid
            for (let s = 0; s < t.steps.length; s++) {
                const btn = matrixStepElements[i][s];
                if (!btn) continue;

                // Clear all classes first
                btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3',
                    'auto-level-1', 'auto-level-2', 'auto-level-3',
                    'auto-level-4', 'auto-level-5');

                // Apply appropriate class based on track type
                if (t.type === 'automation') {
                    if (t.steps[s] > 0) {
                        btn.classList.add('active', `auto-level-${t.steps[s]}`);
                    }
                } else {
                    if (t.steps[s] > 0) {
                        btn.classList.add(`vel-${t.steps[s]}`);
                    }
                }
            }
        }

        selectTrackCallback(selectedTrackIndex);
        if (audioEngine.onBpmChange) audioEngine.onBpmChange(bpm);
    }
}