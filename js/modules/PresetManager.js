// Preset Manager Module
import { NUM_LFOS } from '../utils/constants.js';

export class PresetManager {
    savePreset(tracks, bpm) {
        const data = {
            bpm: bpm,
            tracks: tracks.map(t => ({
                id: t.id, params: t.params, steps: t.steps, muted: t.muted, soloed: t.soloed, stepLock: t.stepLock,
                lfos: t.lfos.map(l => ({ wave: l.wave, rate: l.rate, amount: l.amount, target: l.target }))
            }))
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url;
        a.download = `grain_preset_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    }

    loadPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(!data.tracks || !Array.isArray(data.tracks)) throw new Error("Invalid preset");
                const bpm = data.bpm || 120;
                
                // Ensure we have enough tracks
                while(tracks.length < data.tracks.length) addTrackCallback();
                
                data.tracks.forEach((trackData, i) => {
                    if (i >= tracks.length) return;
                    const t = tracks[i];
                    t.params = { ...t.params, ...trackData.params };
                    t.steps = [...trackData.steps];
                    t.muted = !!trackData.muted; t.soloed = !!trackData.soloed;
                    t.stepLock = !!trackData.stepLock;
                    if (trackData.lfos) trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave; t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount; t.lfos[lIdx].target = lData.target;
                        }
                    });
                    updateTrackStateUICallback(i);
                    // Refresh grid
                    for(let s=0; s<t.steps.length; s++) {
                         const btn = matrixStepElements[i][s];
                         if(t.steps[s]) btn.classList.add('active'); else btn.classList.remove('active');
                    }
                });
                selectTrackCallback(selectedTrackIndex);
                return bpm;
            } catch (err) { 
                console.error(err); 
                alert("Failed to load preset."); 
                return null;
            }
        };
        reader.readAsText(file);
    }
}
