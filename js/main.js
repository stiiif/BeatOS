// ... (Previous imports and init code) ...

// Save Preset (Updated for async ZIP generation)
document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    const originalHtml = btn.innerHTML;
    
    // UI Feedback
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

// ... (Rest of the file) ...