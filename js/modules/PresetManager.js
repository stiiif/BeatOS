// Preset Manager Module
import { NUM_LFOS } from '../utils/constants.js';
import { AudioUtils } from '../utils/AudioUtils.js';
import { Modulator } from './modulators/Modulator.js';

export class PresetManager {
    // --- SAVE LOGIC ---
    async savePreset(tracks, bpm, extraState = {}) {
        const zip = new JSZip();
        
        const tracksData = [];
        
        for(let i=0; i<tracks.length; i++) {
            const t = tracks[i];
            const trackObj = {
                id: t.id, 
                type: t.type || 'granular',
                clockDivider: t.clockDivider || 1,
                params: t.params, 
                steps: Array.from(t.steps), 
                microtiming: Array.from(t.microtiming || []),
                muted: t.muted, 
                soloed: t.soloed, 
                stepLock: t.stepLock,
                ignoreRandom: t.ignoreRandom || false,
                chokeGroup: t.chokeGroup || 0,
                resetOnBar: t.resetOnBar || false,
                resetOnTrig: t.resetOnTrig || false,
                cleanMode: t.cleanMode || false,
                scanSync: t.scanSync || false,
                scanSyncMultiplier: t.scanSyncMultiplier || 1,
                lfos: t.lfos.map(l => l.serialize ? l.serialize() : { 
                    wave: l.wave, 
                    rate: l.rate, 
                    amount: l.amount, 
                    targets: l.targets
                }),
                stepPitches: t.stepPitches || null,
                samplePath: null
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
            version: "4.0",
            tracks: tracksData,
            // Snapshot Bank (16 slots)
            snapshots: extraState.snapshotBank ? extraState.snapshotBank.serialize() : [],
            // Song Mode arrangement
            songMode: extraState.songSequencer ? extraState.songSequencer.serialize() : null,
            // FX Engines
            effectsManager: extraState.effectsManager ? extraState.effectsManager.effects.map(fx => ({
                id: fx.id,
                params: [...fx.params],
                lfos: fx.lfos.map(l => l.serialize ? l.serialize() : { wave: l.wave, rate: l.rate, amount: l.amount }),
                matrix: fx.matrix.map(row => [...row])
            })) : null,
            // Mixer Automation
            mixerAutomation: extraState.mixerAutomation ? extraState.mixerAutomation.serialize() : null,
            // Group Bus params
            groupBuses: extraState.audioEngine ? extraState.audioEngine.groupBuses.map(g => g ? ({
                volume: g.volume ? g.volume.gain.value : 0.8,
                pan: g.volume ? 0 : 0, // Pan is a StereoPannerNode
                params: g.params ? { ...g.params } : {}
            }) : null) : null,
            // Return Bus params
            returnBuses: extraState.audioEngine ? extraState.audioEngine.returnBuses.map(r => r ? ({
                params: r.params ? { ...r.params } : {}
            }) : null) : null,
            // Master volume
            masterVolume: extraState.audioEngine && extraState.audioEngine.masterBus ? 
                extraState.audioEngine.masterBus.volume.gain.value : 1.0
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
    loadPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, extraState = {}) {
        if (!file) return;
        const isZip = file.name.endsWith('.beatos') || file.name.endsWith('.zip');
        if (isZip) {
            this.loadZipPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, extraState);
        } else {
            this.loadJsonPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, extraState);
        }
    }

    async loadZipPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, extraState = {}) {
        try {
            const zip = await JSZip.loadAsync(file);
            if (!zip.file("preset.json")) throw new Error("Invalid .beatos file: missing preset.json");
            const jsonStr = await zip.file("preset.json").async("string");
            const data = JSON.parse(jsonStr);
            await this.applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, zip, extraState);
        } catch (err) {
            console.error(err);
            alert("Failed to load .beatos file: " + err.message);
        }
    }

    loadJsonPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, extraState = {}) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, null, extraState);
            } catch (err) { 
                console.error(err); 
                alert("Failed to load JSON preset."); 
            }
        };
        reader.readAsText(file);
    }

    // Shared application logic
    async applyPresetData(data, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine, zipInstance, extraState = {}) {
        if(!data.tracks || !Array.isArray(data.tracks)) throw new Error("Invalid preset structure");
        
        const bpm = data.bpm || 120;
        const audioCtx = audioEngine.getContext();

        // Ensure we have enough tracks
        while(tracks.length < data.tracks.length) addTrackCallback();
        
        for (let i = 0; i < data.tracks.length; i++) {
            const trackData = data.tracks[i];
            if (i >= tracks.length) break;
            
            const t = tracks[i];
            t.type = trackData.type || 'granular';
            t.clockDivider = trackData.clockDivider || 1;
            t.params = { ...t.params, ...trackData.params };
            
            // Backward compat: convert old pitch ratio to semitones
            if (trackData.params && trackData.params.pitch !== undefined && trackData.params.pitchSemi === undefined) {
                t.params.pitchSemi = Math.round(12 * Math.log2(trackData.params.pitch || 1));
                t.params.pitchFine = 0;
            }
            
            if (trackData.stepPitches) {
                t.stepPitches = trackData.stepPitches;
            }
            
            // Restore microtiming
            if (trackData.microtiming) {
                const mt = new Float32Array(t.microtiming.length);
                for (let j = 0; j < Math.min(trackData.microtiming.length, mt.length); j++) {
                    mt[j] = trackData.microtiming[j];
                }
                t.microtiming = mt;
            }
            
            t.steps = new Uint8Array(trackData.steps);
            t.muted = !!trackData.muted; 
            t.soloed = !!trackData.soloed;
            t.stepLock = !!trackData.stepLock;
            t.ignoreRandom = !!trackData.ignoreRandom;
            t.chokeGroup = trackData.chokeGroup || 0;
            t.resetOnBar = !!trackData.resetOnBar;
            t.resetOnTrig = !!trackData.resetOnTrig;
            t.cleanMode = !!trackData.cleanMode;
            t.scanSync = !!trackData.scanSync;
            t.scanSyncMultiplier = trackData.scanSyncMultiplier || 1;
            
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
            // Refresh grid — restore velocity/accent levels
            for(let s=0; s<t.steps.length; s++) {
                 const btn = matrixStepElements[i]?.[s];
                 if (!btn) continue;
                 btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3',
                     'auto-level-1', 'auto-level-2', 'auto-level-3', 'auto-level-4', 'auto-level-5');
                 const val = t.steps[s];
                 if (val > 0) {
                     if (t.type === 'automation') {
                         btn.classList.add('active', `auto-level-${val}`);
                     } else {
                         btn.classList.add(`vel-${val}`);
                     }
                 }
            }
        }
        
        selectTrackCallback(selectedTrackIndex);
        if (audioEngine.onBpmChange) audioEngine.onBpmChange(bpm);

        // --- RESTORE FX ENGINE STATE ---
        if (data.effectsManager && extraState.effectsManager) {
            const em = extraState.effectsManager;
            data.effectsManager.forEach((fxData, fxIdx) => {
                if (fxIdx >= em.effects.length) return;
                const fx = em.effects[fxIdx];
                // Params
                if (fxData.params) {
                    for (let i = 0; i < Math.min(fxData.params.length, fx.params.length); i++) {
                        fx.params[i] = fxData.params[i];
                    }
                }
                // LFOs
                if (fxData.lfos) {
                    fxData.lfos.forEach((lData, lIdx) => {
                        if (lIdx >= fx.lfos.length) return;
                        if (lData.type !== undefined) {
                            fx.lfos[lIdx] = Modulator.deserialize(lData);
                        } else {
                            const lfo = fx.lfos[lIdx];
                            if (lData.wave !== undefined) lfo.wave = lData.wave;
                            if (lData.rate !== undefined) lfo.rate = lData.rate;
                            if (lData.amount !== undefined) lfo.amount = lData.amount;
                            if (lData.sync !== undefined) lfo.sync = lData.sync;
                            if (lData.syncRateIndex !== undefined) lfo.syncRateIndex = lData.syncRateIndex;
                            if (lData.targets) lfo.targets = [...lData.targets];
                        }
                    });
                }
                // Matrix
                if (fxData.matrix) {
                    fx.matrix = fxData.matrix.map(row => [...row]);
                }
            });
        }

        // --- RESTORE MIXER AUTOMATION ---
        if (data.mixerAutomation && extraState.mixerAutomation) {
            extraState.mixerAutomation.deserialize(data.mixerAutomation);
        }

        // --- RESTORE GROUP BUS PARAMS ---
        if (data.groupBuses && audioEngine.groupBuses) {
            data.groupBuses.forEach((gData, gIdx) => {
                if (!gData || !audioEngine.groupBuses[gIdx]) return;
                const bus = audioEngine.groupBuses[gIdx];
                if (gData.volume !== undefined && bus.volume) {
                    bus.volume.gain.value = gData.volume;
                }
                if (gData.params) {
                    Object.assign(bus.params || {}, gData.params);
                }
            });
        }

        // --- RESTORE RETURN BUS PARAMS ---
        if (data.returnBuses && audioEngine.returnBuses) {
            data.returnBuses.forEach((rData, rIdx) => {
                if (!rData || !audioEngine.returnBuses[rIdx]) return;
                const bus = audioEngine.returnBuses[rIdx];
                if (rData.params) {
                    Object.assign(bus.params || {}, rData.params);
                }
            });
        }

        // --- RESTORE MASTER VOLUME ---
        if (data.masterVolume !== undefined && audioEngine.masterBus && audioEngine.masterBus.volume) {
            audioEngine.masterBus.volume.gain.value = data.masterVolume;
        }

        // --- RESTORE SNAPSHOT BANK ---
        if (data.snapshots && extraState.snapshotBank) {
            extraState.snapshotBank.deserialize(data.snapshots);
        }

        // --- RESTORE SONG MODE ---
        if (data.songMode && extraState.songPanel) {
            extraState.songPanel.deserialize(data.songMode);
        }

        // Signal that a full refresh is needed (mixer, FX UI)
        if (extraState.onLoadComplete) extraState.onLoadComplete();
    }
}