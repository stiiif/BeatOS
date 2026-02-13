// js/ui/components/PitchHarmonyUI.js
// Renders the Scale, Chord, and Voice controls below the pitch sliders.

import { SCALE_NAMES, CHORD_NAMES, NOTE_NAMES, VOICE_MODES } from '../../modules/pitch/PitchLibrary.js';

export class PitchHarmonyUI {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
    }

    setTracks(tracks) { this.tracks = tracks; }
    setSelectedTrackIndex(idx) { this.selectedTrackIndex = idx; this.render(); }

    render() {
        const container = document.getElementById('pitchHarmonySection');
        if (!container) return;

        const track = this.tracks[this.selectedTrackIndex];
        if (!track || track.type !== 'granular') {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = '';
        const p = track.params;

        // ═══ SCALE ROW ═══
        const scaleRow = _mkRow();
        
        // Snap toggle
        const snapBtn = document.createElement('div');
        snapBtn.className = `wave-btn ${p.pitchSnap ? 'active' : ''}`;
        snapBtn.innerText = '♪';
        snapBtn.title = p.pitchSnap ? 'Snap ON' : 'Snap OFF';
        snapBtn.style.cssText = 'font-size:10px; padding:2px 5px; cursor:pointer; flex:0 0 auto;';
        snapBtn.onclick = () => { p.pitchSnap = !p.pitchSnap; this.render(); };
        scaleRow.appendChild(snapBtn);

        // Root selector
        const rootSel = _mkSelect(NOTE_NAMES.map((n, i) => ({ value: i, label: n })), p.scaleRoot,
            (v) => { p.scaleRoot = parseInt(v); });
        rootSel.title = 'Scale Root';
        scaleRow.appendChild(rootSel);

        // Scale type selector
        const scaleOptions = Object.entries(SCALE_NAMES).map(([id, name]) => ({ value: id, label: name }));
        const scaleSel = _mkSelect(scaleOptions, p.scaleType, (v) => { p.scaleType = v; });
        scaleSel.style.flex = '1';
        scaleSel.title = 'Scale Type';
        scaleRow.appendChild(scaleSel);
        
        container.appendChild(scaleRow);

        // ═══ CHORD ROW ═══
        const chordRow = _mkRow();

        // Chord type — compact buttons for common, dropdown for all
        const commonChords = ['unison', 'octaves', 'fifth', 'major', 'minor', 'sus2', 'min7', 'dom7'];
        const btnGrid = document.createElement('div');
        btnGrid.style.cssText = 'display:flex; flex-wrap:wrap; gap:1px; flex:1;';
        commonChords.forEach(id => {
            const btn = document.createElement('div');
            btn.className = `wave-btn ${p.chordType === id ? 'active' : ''}`;
            btn.innerText = CHORD_NAMES[id] || id;
            btn.style.cssText = 'font-size:7px; padding:1px 3px; cursor:pointer;';
            btn.onclick = () => { p.chordType = id; this.render(); };
            btnGrid.appendChild(btn);
        });

        // "More" dropdown for extended chords
        const moreSel = _mkSelect(
            Object.entries(CHORD_NAMES).map(([id, name]) => ({ value: id, label: name })),
            p.chordType,
            (v) => { p.chordType = v; this.render(); }
        );
        moreSel.style.cssText = 'width:50px; flex:0 0 auto;';
        moreSel.title = 'All chord types';

        chordRow.appendChild(btnGrid);
        chordRow.appendChild(moreSel);
        container.appendChild(chordRow);

        // ═══ VOICE ROW (only when chord ≠ unison) ═══
        if (p.chordType !== 'unison') {
            const voiceRow = _mkRow();

            // Voice mode buttons
            VOICE_MODES.forEach(mode => {
                const btn = document.createElement('div');
                btn.className = `wave-btn ${p.voiceMode === mode ? 'active' : ''}`;
                btn.innerText = mode.substring(0, 3).toUpperCase();
                btn.style.cssText = 'font-size:7px; padding:1px 4px; cursor:pointer;';
                btn.onclick = () => { p.voiceMode = mode; this.render(); };
                voiceRow.appendChild(btn);
            });

            // Spread slider (0-3)
            const spreadLabel = document.createElement('span');
            spreadLabel.style.cssText = 'font-size:7px; color:#666; margin-left:4px;';
            spreadLabel.innerText = 'SPR';
            voiceRow.appendChild(spreadLabel);

            const spreadSlider = document.createElement('input');
            spreadSlider.type = 'range';
            spreadSlider.className = 'micro-slider';
            spreadSlider.min = 0; spreadSlider.max = 3; spreadSlider.step = 1;
            spreadSlider.value = p.chordSpread;
            spreadSlider.style.flex = '1';
            spreadSlider.title = `Spread: ${p.chordSpread} oct`;
            spreadSlider.oninput = (e) => {
                p.chordSpread = parseInt(e.target.value);
                spreadSlider.title = `Spread: ${p.chordSpread} oct`;
            };
            voiceRow.appendChild(spreadSlider);

            // Inversion buttons (0-3)
            const invLabel = document.createElement('span');
            invLabel.style.cssText = 'font-size:7px; color:#666; margin-left:4px;';
            invLabel.innerText = 'INV';
            voiceRow.appendChild(invLabel);

            for (let i = 0; i < 4; i++) {
                const btn = document.createElement('div');
                btn.className = `wave-btn ${p.chordInversion === i ? 'active' : ''}`;
                btn.innerText = i;
                btn.style.cssText = 'font-size:7px; padding:1px 4px; cursor:pointer;';
                btn.onclick = () => { p.chordInversion = i; this.render(); };
                voiceRow.appendChild(btn);
            }

            container.appendChild(voiceRow);
        }
    }
}

// ═══ Helpers ═══
function _mkRow() {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:2px; padding:2px 0;';
    return row;
}

function _mkSelect(options, current, setter) {
    const sel = document.createElement('select');
    sel.style.cssText = 'background:#1a1a1a; color:#ccc; border:1px solid #333; font-size:8px; padding:1px 2px; border-radius:3px;';
    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.innerText = o.label;
        if (String(o.value) === String(current)) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => setter(e.target.value);
    return sel;
}
