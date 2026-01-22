// Main Application Entry Point
import { AudioEngine } from './core/AudioEngine.js';
import { GranularSynth } from './core/GranularSynth.js';
import { Scheduler } from './core/Scheduler.js';
import { TrackManager } from './modules/TrackManager.js';
import { PresetManager } from './modules/PresetManager.js';
import { TrackLibrary } from './modules/TrackLibrary.js';
import { UIManager } from './ui/UIManager.js';
import { Visualizer } from './ui/Visualizer.js';
import { LayoutManager } from './ui/LayoutManager.js';
import { NUM_LFOS } from './utils/constants.js';

// Initialize all systems
const audioEngine = new AudioEngine();
const granularSynth = new GranularSynth(audioEngine);
const scheduler = new Scheduler(audioEngine, granularSynth);
const trackManager = new TrackManager(audioEngine);
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();
const uiManager = new UIManager();
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);

// Initialize Layout
const layoutManager = new LayoutManager();

// Initialize tracks
trackManager.initTracks();
const tracks = trackManager.getTracks();

// Wire up dependencies
scheduler.setTracks(tracks);
uiManager.setTracks(tracks);
visualizer.setTracks(tracks);

// Setup UI callbacks
scheduler.setUpdateMatrixHeadCallback((step) => uiManager.updateMatrixHead(step));
scheduler.setRandomChokeCallback(() => uiManager.getRandomChokeInfo());

// Add track functionality
function addTrack() {
    const newId = trackManager.addTrack();
    if (newId !== null) {
        uiManager.appendTrackRow(newId, () => {
            visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
            visualizer.drawBufferDisplay();
        });
        visualizer.resizeCanvas();
    }
}

// Add group functionality (adds 4 tracks at once)
function addGroup() {
    const tracksAdded = [];
    for (let i = 0; i < 4; i++) {
        const newId = trackManager.addTrack();
        if (newId !== null) {
            tracksAdded.push(newId);
        }
    }
    // Render all new tracks
    tracksAdded.forEach(id => uiManager.appendTrackRow(id, () => {
        visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
        visualizer.drawBufferDisplay();
    }));
    if (tracksAdded.length > 0) {
        visualizer.resizeCanvas();
    }
}

// Initialize Audio Button
document.getElementById('initAudioBtn').addEventListener('click', async () => {
    await audioEngine.initialize();
    trackManager.createBuffersForAllTracks();
    document.getElementById('startOverlay').classList.add('hidden');
    visualizer.drawVisuals();
    uiManager.selectTrack(0, () => {
        visualizer.setSelectedTrackIndex(0);
        visualizer.drawBufferDisplay();
    });
    visualizer.setSelectedTrackIndex(0);
    visualizer.drawBufferDisplay();
    // Force initial LFO UI update to apply group colors
    uiManager.updateLfoUI();
});

// Play Button
document.getElementById('playBtn').addEventListener('click', () => {
    if (!audioEngine.getContext()) return;
    if (!scheduler.getIsPlaying()) {
        scheduler.start((time, trackId) => visualizer.scheduleVisualDraw(time, trackId));
        document.getElementById('playBtn').classList.add('text-emerald-500');
    }
});

// Stop Button
document.getElementById('stopBtn').addEventListener('click', () => {
    scheduler.stop();
    document.getElementById('playBtn').classList.remove('text-emerald-500');
    uiManager.clearPlayheadForStop();
});

// BPM Control
document.getElementById('bpmInput').addEventListener('change', e => {
    scheduler.setBPM(e.target.value);
});

// Pattern Randomization
document.getElementById('randomizeAllPatternsBtn').addEventListener('click', () => {
    uiManager.randomizeAllPatterns();
});

// Randomize All Params with position-based release control
document.getElementById('randAllParamsBtn').addEventListener('click', (e) => {
    // Calculate click position relative to button
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const buttonWidth = rect.width;
    const clickRatio = clickX / buttonWidth;
    
    // Determine release range based on click position (5 zones)
    let releaseMin, releaseMax, zoneName;
    if (clickRatio < 0.2) {
        // Zone 1: Far left - very short
        releaseMin = 0.01;
        releaseMax = 0.2;
        zoneName = 'VERY SHORT';
    } else if (clickRatio < 0.4) {
        // Zone 2: Left - short
        releaseMin = 0.2;
        releaseMax = 0.6;
        zoneName = 'SHORT';
    } else if (clickRatio < 0.6) {
        // Zone 3: Center - medium
        releaseMin = 0.6;
        releaseMax = 1.2;
        zoneName = 'MEDIUM';
    } else if (clickRatio < 0.8) {
        // Zone 4: Right - long
        releaseMin = 1.2;
        releaseMax = 1.6;
        zoneName = 'LONG';
    } else {
        // Zone 5: Far right - very long
        releaseMin = 1.6;
        releaseMax = 2.0;
        zoneName = 'VERY LONG';
    }
    
    // Visual feedback - flash the button with zone info
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `${zoneName} REL`;
    btn.style.transition = 'none';
    btn.style.backgroundColor = '#4f46e5';
    
    setTimeout(() => {
        btn.style.transition = '';
        btn.style.backgroundColor = '';
        btn.innerHTML = originalText;
    }, 300);
    
    tracks.forEach(t => {
        trackManager.randomizeTrackParams(t, releaseMin, releaseMax);
        trackManager.randomizeTrackModulators(t);
    });
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.drawBufferDisplay();
});

// Randomize Track Params
document.getElementById('randomizeBtn').addEventListener('click', () => {
    trackManager.randomizeTrackParams(tracks[uiManager.getSelectedTrackIndex()]);
    uiManager.updateKnobs();
    visualizer.drawBufferDisplay();
});

// Randomize Modulators
document.getElementById('randModsBtn').addEventListener('click', () => {
    trackManager.randomizeTrackModulators(tracks[uiManager.getSelectedTrackIndex()]);
    uiManager.updateLfoUI();
});

// Randomize Panning
document.getElementById('randPanBtn').addEventListener('click', () => {
    trackManager.randomizePanning();
    // Save as new baseline for shifting
    uiManager.savePanBaseline();
    // Reset shift slider
    document.getElementById('panShiftSlider').value = 0;
    document.getElementById('panShiftValue').innerText = '0%';
    // Visual feedback
    const btn = document.getElementById('randPanBtn');
    const originalBg = btn.style.backgroundColor;
    btn.style.backgroundColor = '#0891b2'; // cyan-600
    setTimeout(() => {
        btn.style.backgroundColor = originalBg;
    }, 200);
});

// Reset Track Params
document.getElementById('resetParamBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    
    // Apply requested parameter values
    t.params.position = 0.00;
    t.params.spray = 0.00;
    t.params.grainSize = 0.11;
    t.params.density = 3.00;
    t.params.pitch = 1.00;
    t.params.attack = 0.00; 
    t.params.release = 0.50;
    t.params.hpFilter = 20.00;
    t.params.filter = 10000.00;
    t.params.volume = 0.80;

    // Turn OFF all LFO targets
    t.lfos.forEach(lfo => {
        lfo.target = 'none';
    });

    // Update UI components
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.drawBufferDisplay();

    // Optional: Visual feedback on the button
    const btn = document.getElementById('resetParamBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Done';
    btn.classList.add('text-emerald-400', 'border-emerald-500');
    
    setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.classList.remove('text-emerald-400', 'border-emerald-500');
    }, 800);
});

// NEW SOUND GENERATOR BUTTONS LOGIC
document.querySelectorAll('.sound-gen-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!audioEngine.getContext()) return;
        
        const type = e.target.dataset.type;
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        
        // Generate new buffer
        const newBuf = audioEngine.generateBufferByType(type);
        if (newBuf) {
            t.buffer = newBuf;
            t.customSample = null; // Clear custom sample flag as we are using synth now
            
            // Visual feedback
            visualizer.drawBufferDisplay();
            
            // Update label
            const typeLabel = document.getElementById('trackTypeLabel');
            typeLabel.textContent = type.toUpperCase() + ' (Synth)';
            typeLabel.title = `Synthesized ${type}`;
            
            // Button flash effect
            const originalBg = e.target.style.backgroundColor;
            e.target.style.backgroundColor = '#059669'; // Emerald
            setTimeout(() => { e.target.style.backgroundColor = originalBg; }, 200);
        }
    });
});

// Wire up the new inline "Sample" button to the existing file input
document.getElementById('loadSampleBtnInline').addEventListener('click', () => {
    document.getElementById('sampleInput').click();
});


// Global Pan Shift Slider
document.getElementById('panShiftSlider').addEventListener('input', (e) => {
    const shiftAmount = parseFloat(e.target.value);
    uiManager.applyPanShift(shiftAmount);
    document.getElementById('panShiftValue').innerText = Math.round(shiftAmount * 100) + '%';
});

// Clear Track
document.getElementById('clearTrackBtn').addEventListener('click', () => {
    uiManager.clearTrack(uiManager.getSelectedTrackIndex());
});

// Snapshot
document.getElementById('snapshotBtn').addEventListener('click', () => {
    uiManager.toggleSnapshot();
});

// Random Choke
document.getElementById('rndChokeBtn').addEventListener('click', () => {
    uiManager.toggleRandomChoke();
});

// Save Preset (Async for ZIP generation)
document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    const originalHtml = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    
    try {
        await presetManager.savePreset(tracks, scheduler.getBPM());
    } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save project.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
});

// Load Preset
document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Callback for when BPM is loaded from preset
        audioEngine.onBpmChange = (bpm) => {
            scheduler.setBPM(bpm);
            document.getElementById('bpmInput').value = bpm;
        };

        presetManager.loadPreset(
            file,
            tracks,
            addTrack,
            (i) => uiManager.updateTrackStateUI(i),
            uiManager.matrixStepElements,
            (i) => {
                uiManager.selectTrack(i);
                visualizer.setSelectedTrackIndex(i);
                visualizer.drawBufferDisplay();
                
                // Update Track Type Label
                const t = tracks[i];
                const typeLabel = document.getElementById('trackTypeLabel');
                if (t && t.customSample) {
                    typeLabel.textContent = t.customSample.name;
                    typeLabel.title = `Custom Sample: ${t.customSample.name}`;
                } else {
                    typeLabel.textContent = 'Synthesized';
                    typeLabel.title = '';
                }
            },
            uiManager.getSelectedTrackIndex(),
            audioEngine 
        );
    }
    document.getElementById('fileInput').value = '';
});

// Parameter Sliders
document.querySelectorAll('.param-slider').forEach(el => {
    el.addEventListener('input', e => {
        tracks[uiManager.getSelectedTrackIndex()].params[e.target.dataset.param] = parseFloat(e.target.value);
        uiManager.updateKnobs();
        visualizer.drawBufferDisplay();
    });
});

// LFO Tabs
document.querySelectorAll('.lfo-tab').forEach(b => {
    b.addEventListener('click', e => {
        uiManager.setSelectedLfoIndex(parseInt(e.target.dataset.lfo));
        uiManager.updateLfoUI();
    });
});

// LFO Controls
document.getElementById('lfoTarget').addEventListener('change', e => {
    tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].target = e.target.value;
});

document.getElementById('lfoWave').addEventListener('change', e => {
    tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].wave = e.target.value;
});

document.getElementById('lfoRate').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].rate = v;
    document.getElementById('lfoRateVal').innerText = v.toFixed(1);
});

document.getElementById('lfoAmt').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].amount = v;
    document.getElementById('lfoAmtVal').innerText = v.toFixed(2);
});

// Initialize UI
uiManager.initUI(addTrack, addGroup, () => {
    visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
    visualizer.drawBufferDisplay();
});

// Setup window resize handler
window.addEventListener('resize', () => visualizer.resizeCanvas());
visualizer.resizeCanvas();

// ============= NEW FEATURES: Track Library & Custom Samples =============

// Debug: Verify buttons exist
console.log('Initializing new features...');
console.log('saveTrackBtn:', document.getElementById('saveTrackBtn'));
console.log('loadTrackBtn:', document.getElementById('loadTrackBtn'));
console.log('loadSampleBtn:', document.getElementById('loadSampleBtn'));

// Save Track to Library (LocalStorage)
document.getElementById('saveTrackBtn').addEventListener('click', () => {
    try {
        if (!tracks || tracks.length === 0) {
            alert('Please initialize audio first by clicking "INITIALIZE AUDIO"');
            return;
        }
        const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
        if (!currentTrack) {
            alert('No track selected');
            return;
        }
        const savedTrack = trackLibrary.saveTrack(currentTrack);
        if (savedTrack) {
            // Visual feedback
            const btn = document.getElementById('saveTrackBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check mr-1"></i>Saved!';
            btn.classList.add('bg-amber-600');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-amber-600');
            }, 1000);
        }
    } catch (error) {
        console.error('Error saving track:', error);
        alert('Failed to save track: ' + error.message);
    }
});

// EXPORT CURRENT TRACK to FILE (.beattrk)
document.getElementById('exportCurrentTrackBtn').addEventListener('click', async () => {
    try {
        if (!tracks || tracks.length === 0) {
            alert('Please initialize audio first');
            return;
        }
        const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
        if (!currentTrack) {
            alert('No track selected');
            return;
        }

        const btn = document.getElementById('exportCurrentTrackBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Exporting...';
        btn.disabled = true;

        await trackLibrary.exportTrackToZip(currentTrack);

        btn.innerHTML = originalText;
        btn.disabled = false;

    } catch (error) {
        console.error('Error exporting track:', error);
        alert('Failed to export track: ' + error.message);
        const btn = document.getElementById('exportCurrentTrackBtn');
        btn.innerHTML = '<i class="fas fa-file-export mr-1"></i>Export';
        btn.disabled = false;
    }
});


// Load Track from Library - Show Modal
document.getElementById('loadTrackBtn').addEventListener('click', () => {
    try {
        if (!tracks || tracks.length === 0) {
            alert('Please initialize audio first by clicking "INITIALIZE AUDIO"');
            return;
        }
        showTrackLibrary();
    } catch (error) {
        console.error('Error loading track library:', error);
        alert('Failed to open track library: ' + error.message);
    }
});

// Close Library Modal
document.getElementById('closeLibraryBtn').addEventListener('click', () => {
    document.getElementById('trackLibraryModal').classList.add('hidden');
});

// Close modal when clicking outside
document.getElementById('trackLibraryModal').addEventListener('click', (e) => {
    if (e.target.id === 'trackLibraryModal') {
        document.getElementById('trackLibraryModal').classList.add('hidden');
    }
});

// Import Track from File (Handles .json and .beattrk)
document.getElementById('importTrackBtn').addEventListener('click', () => {
    document.getElementById('importTrackInput').click();
});

document.getElementById('importTrackInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Handle .beattrk or .zip file (New Format)
        if (file.name.endsWith('.beattrk') || file.name.endsWith('.zip')) {
             trackLibrary.importTrackFromZip(file, async (success, trackData, arrayBuffer) => {
                if (success) {
                    // We found a sample, so let's load it directly into the current track
                    // instead of just adding it to the metadata library
                    const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
                    const audioCtx = audioEngine.getContext();

                    // Apply Parameters
                    currentTrack.params = { ...currentTrack.params, ...trackData.params };
                    currentTrack.steps = [...trackData.steps];
                    currentTrack.muted = !!trackData.muted;
                    currentTrack.soloed = !!trackData.soloed;
                    currentTrack.stepLock = !!trackData.stepLock;

                    if (trackData.lfos) {
                        trackData.lfos.forEach((lData, lIdx) => {
                            if (lIdx < NUM_LFOS) {
                                currentTrack.lfos[lIdx].wave = lData.wave;
                                currentTrack.lfos[lIdx].rate = lData.rate;
                                currentTrack.lfos[lIdx].amount = lData.amount;
                                currentTrack.lfos[lIdx].target = lData.target;
                            }
                        });
                    }

                    // Decode and Apply Audio
                    if (arrayBuffer && audioCtx) {
                         try {
                            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                            currentTrack.customSample = {
                                name: trackData.sampleName || "Imported .beattrk",
                                buffer: audioBuffer,
                                duration: audioBuffer.duration
                            };
                            currentTrack.buffer = audioBuffer;
                            
                            // Update Track Label
                            const typeLabel = document.getElementById('trackTypeLabel');
                            typeLabel.textContent = currentTrack.customSample.name;
                            typeLabel.title = currentTrack.customSample.name;
                         } catch (err) {
                             console.error("Error decoding .beattrk audio", err);
                             alert("Loaded track settings, but failed to decode audio sample.");
                         }
                    } else if (trackData.hasSample) {
                        alert("Note: This track setting expects a sample but none was found in the file.");
                    }

                    // Update UI
                    uiManager.updateKnobs();
                    uiManager.updateLfoUI();
                    uiManager.updateTrackStateUI(uiManager.getSelectedTrackIndex());
                    
                    // Update grid
                    const matrixSteps = uiManager.matrixStepElements[uiManager.getSelectedTrackIndex()];
                    for (let s = 0; s < currentTrack.steps.length; s++) {
                        if (currentTrack.steps[s]) {
                            matrixSteps[s].classList.add('active');
                        } else {
                            matrixSteps[s].classList.remove('active');
                        }
                    }
                    visualizer.drawBufferDisplay();
                    
                    document.getElementById('trackLibraryModal').classList.add('hidden');
                    alert(`Loaded "${trackData.name}" directly to current track!`);
                    
                    // Optionally also save to library (metadata only)
                    // trackLibrary.savedTracks.push(trackData);
                    // trackLibrary.saveLibrary();
                }
             });
        } 
        // Handle .json (Legacy)
        else {
            trackLibrary.importTrack(file, (success) => {
                if (success) {
                    showTrackLibrary(); // Refresh the library view
                    alert('Track imported to library successfully!');
                }
            });
        }
    }
    e.target.value = '';
});

// Load Custom Sample
document.getElementById('loadSampleBtn').addEventListener('click', () => {
    try {
        if (!tracks || tracks.length === 0) {
            alert('Please initialize audio first by clicking "INITIALIZE AUDIO"');
            return;
        }
        if (!audioEngine.getContext()) {
            alert('Please initialize audio first by clicking "INITIALIZE AUDIO"');
            return;
        }
        document.getElementById('sampleInput').click();
    } catch (error) {
        console.error('Error opening sample picker:', error);
        alert('Failed to open sample picker: ' + error.message);
    }
});

document.getElementById('sampleInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
    const btn = document.getElementById('loadSampleBtn');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...';
        btn.disabled = true;
        
        await audioEngine.loadCustomSample(file, currentTrack);
        
        // Update UI to show sample is loaded
        const typeLabel = document.getElementById('trackTypeLabel');
        typeLabel.textContent = currentTrack.customSample.name;
        typeLabel.title = `Custom Sample: ${currentTrack.customSample.name}`;
        
        visualizer.drawBufferDisplay();
        
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Loaded!';
        btn.classList.add('bg-sky-600');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('bg-sky-600');
            btn.disabled = false;
        }, 1500);
    } catch (err) {
        alert('Failed to load audio sample: ' + err.message);
        console.error('Sample loading error:', err);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
    e.target.value = '';
});

// Function to display track library modal
function showTrackLibrary() {
    const modal = document.getElementById('trackLibraryModal');
    const list = document.getElementById('trackLibraryList');
    const emptyMsg = document.getElementById('emptyLibraryMsg');
    const savedTracks = trackLibrary.getSavedTracks();
    
    list.innerHTML = '';
    
    if (savedTracks.length === 0) {
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        
        savedTracks.forEach((trackData, index) => {
            const item = document.createElement('div');
            item.className = 'bg-neutral-800 rounded p-3 flex items-center justify-between hover:bg-neutral-750 transition border border-neutral-700';
            
            const date = new Date(trackData.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            item.innerHTML = `
                <div class="flex-1">
                    <div class="font-bold text-white text-sm">${trackData.name}</div>
                    <div class="text-xs text-neutral-400 mt-1">
                        <span class="mr-3"><i class="far fa-clock mr-1"></i>${dateStr}</span>
                        ${trackData.customSample ? `<span class="text-sky-400"><i class="fas fa-file-audio mr-1"></i>${trackData.customSample.name}</span>` : '<span class="text-emerald-400"><i class="fas fa-waveform-lines mr-1"></i>Synthesized</span>'}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="load-track-btn text-xs bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 px-3 py-1 rounded transition border border-emerald-900/50" data-index="${index}">
                        <i class="fas fa-download mr-1"></i>Load
                    </button>
                    <button class="export-track-btn text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-2 py-1 rounded transition" data-index="${index}" title="Export to file">
                        <i class="fas fa-file-export"></i>
                    </button>
                    <button class="delete-track-btn text-xs bg-red-900/40 hover:bg-red-800 text-red-300 px-2 py-1 rounded transition" data-index="${index}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            list.appendChild(item);
        });
        
        // Add event listeners for load buttons
        list.querySelectorAll('.load-track-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
                const success = trackLibrary.loadTrackInto(index, currentTrack);
                
                if (success) {
                    // Update UI
                    uiManager.updateKnobs();
                    uiManager.updateLfoUI();
                    uiManager.updateTrackStateUI(uiManager.getSelectedTrackIndex());
                    
                    // Update step grid
                    const matrixSteps = uiManager.matrixStepElements[uiManager.getSelectedTrackIndex()];
                    for (let s = 0; s < currentTrack.steps.length; s++) {
                        if (currentTrack.steps[s]) {
                            matrixSteps[s].classList.add('active');
                        } else {
                            matrixSteps[s].classList.remove('active');
                        }
                    }
                    
                    // Update track type label
                    const typeLabel = document.getElementById('trackTypeLabel');
                    if (currentTrack.customSample) {
                        typeLabel.textContent = currentTrack.customSample.name;
                        typeLabel.title = `Custom Sample: ${currentTrack.customSample.name}`;
                    } else {
                        typeLabel.textContent = 'Synthesized';
                        typeLabel.title = '';
                    }
                    
                    visualizer.drawBufferDisplay();
                    
                    // Close modal
                    modal.classList.add('hidden');
                    
                    // Show notification if custom sample needs to be reloaded
                    if (currentTrack.needsSampleReload) {
                        alert('Note: This track used a custom sample. Please load the sample file again using "Load Sample" button.');
                        currentTrack.needsSampleReload = false;
                    }
                }
            });
        });
        
        // Add event listeners for export buttons
        list.querySelectorAll('.export-track-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                trackLibrary.exportTrack(index);
            });
        });
        
        // Add event listeners for delete buttons
        list.querySelectorAll('.delete-track-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const trackData = savedTracks[index];
                if (confirm(`Delete track "${trackData.name}"?`)) {
                    trackLibrary.deleteTrack(index);
                    showTrackLibrary(); // Refresh
                }
            });
        });
    }
    
    modal.classList.remove('hidden');
}

// ============= GRAIN MONITOR UPDATER =============
const grainMonitorEl = document.getElementById('grainMonitor');
const maxGrainsInput = document.getElementById('maxGrainsInput');

// Max Grains Control
if(maxGrainsInput) {
    maxGrainsInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if(isNaN(val) || val < 10) val = 400;
        granularSynth.setMaxGrains(val);
    });
}

setInterval(() => {
    const count = granularSynth.getActiveGrainCount();
    grainMonitorEl.innerText = count;
    
    // Change color based on load
    if (count > 350) {
        grainMonitorEl.classList.replace('text-emerald-400', 'text-red-500');
        grainMonitorEl.classList.add('font-bold');
    } else if (count > 200) {
        grainMonitorEl.classList.replace('text-emerald-400', 'text-amber-400');
        grainMonitorEl.classList.remove('text-red-500');
        grainMonitorEl.classList.add('font-bold');
    } else {
        grainMonitorEl.classList.remove('text-red-500', 'text-amber-400', 'font-bold');
        grainMonitorEl.classList.add('text-emerald-400');
    }
}, 100);