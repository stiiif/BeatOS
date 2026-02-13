// js/ui/components/PitchHarmonyUI.js
import { SCALE_NAMES, CHORD_NAMES, NOTE_NAMES, VOICE_MODES } from '../../modules/pitch/PitchLibrary.js';

const SCALE_SHORT = {
    chromatic: 'Chrom', major: 'Major', minor: 'Minor', dorian: 'Dorian',
    phrygian: 'Phryg', lydian: 'Lydian', mixolydian: 'Mixo', pentatonic: 'Maj5',
    minPent: 'Min5', blues: 'Blues', wholetone: 'WTone', diminished: 'Dim',
    japanese: 'Japan', arabic: 'Arabic', hungarian: 'Hung', harmonicMin: 'HMin'
};

const CHORD_SHORT = {
    unison: 'Uni', octaves: 'Oct', fifth: '5th', major: 'Maj', minor: 'Min',
    sus2: 'Sus2', sus4: 'Sus4', dim: 'Dim', aug: 'Aug', maj7: 'Maj7',
    min7: 'Min7', dom7: 'Dom7', add9: 'Add9', min9: 'Min9',
    stack4: 'St4', stack5: 'St5', cluster: 'Clu'
};

const VOICE_SHORT = { cycle: 'CYC', random: 'RND', weighted: 'WGT' };

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
        if (!track || track.type !== 'granular') { container.innerHTML = ''; return; }

        container.innerHTML = '';
        const p = track.params;

        // Wire snap button (lives in HTML, not rendered here)
        this._wireSnap(p);

        // All rows use the same 3-column grid as param-grid
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:70px 1fr 45px; gap:4px 6px; align-items:center;';

        // ── Row 3: SRoot ──
        grid.appendChild(mkLabel('SRoot'));
        const rootBtns = mkBtnRow();
        NOTE_NAMES.forEach((n, i) => {
            rootBtns.appendChild(mkBtn(n, p.scaleRoot === i, () => { p.scaleRoot = i; this.render(); }));
        });
        grid.appendChild(rootBtns);
        grid.appendChild(mkValue(NOTE_NAMES[p.scaleRoot]));

        // ── Row 4: SType ──
        grid.appendChild(mkLabel('SType'));
        const scaleBtns = mkBtnRow(true);
        Object.keys(SCALE_SHORT).forEach(id => {
            scaleBtns.appendChild(mkBtn(SCALE_SHORT[id], p.scaleType === id, () => { p.scaleType = id; this.render(); }));
        });
        grid.appendChild(scaleBtns);
        grid.appendChild(mkValue(SCALE_SHORT[p.scaleType] || 'Chrom'));

        // ── Row 5: CType ──
        grid.appendChild(mkLabel('CType'));
        const chordBtns = mkBtnRow(true);
        Object.keys(CHORD_SHORT).forEach(id => {
            chordBtns.appendChild(mkBtn(CHORD_SHORT[id], p.chordType === id, () => { p.chordType = id; this.render(); }));
        });
        grid.appendChild(chordBtns);
        grid.appendChild(mkValue(CHORD_SHORT[p.chordType] || 'Uni'));

        // ── Row 6: Voice (only when chord ≠ unison) ──
        if (p.chordType !== 'unison') {
            grid.appendChild(mkLabel('Voice'));

            const voiceRow = document.createElement('div');
            voiceRow.style.cssText = 'display:flex; gap:1px; align-items:center;';

            // Voice mode buttons
            VOICE_MODES.forEach(mode => {
                voiceRow.appendChild(mkBtn(VOICE_SHORT[mode], p.voiceMode === mode, () => { p.voiceMode = mode; this.render(); }));
            });

            voiceRow.appendChild(mkSep());

            // SPR label + 4 buttons
            voiceRow.appendChild(mkMicroLabel('SPR'));
            for (let s = 0; s <= 3; s++) {
                voiceRow.appendChild(mkBtn(String(s), p.chordSpread === s, () => { p.chordSpread = s; this.render(); }));
            }

            voiceRow.appendChild(mkSep());

            // INV label + 4 buttons
            voiceRow.appendChild(mkMicroLabel('INV'));
            for (let i = 0; i <= 3; i++) {
                voiceRow.appendChild(mkBtn(String(i), p.chordInversion === i, () => { p.chordInversion = i; this.render(); }));
            }

            grid.appendChild(voiceRow);
            grid.appendChild(mkValue(''));
        }

        container.appendChild(grid);
    }

    _wireSnap(p) {
        const btn = document.getElementById('pitchSnapBtn');
        if (!btn) return;
        btn.className = `wave-btn ${p.pitchSnap ? 'active' : ''}`;
        btn.innerText = p.pitchSnap ? 'SNAP \u25CF' : 'SNAP \u25CB';
        btn.style.cssText = `font-size:7px; padding:1px 6px; font-weight:800; letter-spacing:0.5px; cursor:pointer; ${p.pitchSnap ? 'color:#a5b4fc; background:#1e1b4b; border:1px solid #4338ca;' : 'color:#444; background:#111; border:1px solid #333;'}`;
        btn.onclick = () => { p.pitchSnap = !p.pitchSnap; this._wireSnap(p); this._updateSliderStep(p); };
        this._updateSliderStep(p);
    }

    _updateSliderStep(p) {
        const slider = document.querySelector('input[data-param="pitchSemi"]');
        if (!slider) return;
        slider.step = p.pitchSnap ? '1' : '0.01';
        // When snapping on, round current value to nearest integer
        if (p.pitchSnap) {
            p.pitchSemi = Math.round(p.pitchSemi);
            slider.value = p.pitchSemi;
        }
    }
}

// ═══ DOM Helpers ═══
function mkLabel(text) {
    const el = document.createElement('label');
    el.style.cssText = 'font-size:0.65rem; color:#a3a3a3; font-weight:600; text-align:right; white-space:nowrap; display:flex; align-items:flex-start; justify-content:flex-end; padding-top:3px;';
    el.innerText = text;
    return el;
}

function mkValue(text) {
    const el = document.createElement('div');
    el.className = 'value-display';
    el.style.cssText = "font-size:0.65rem; color:#fff; font-weight:600; padding-left:4px; font-family:'JetBrains Mono', monospace;";
    el.innerText = text;
    return el;
}

function mkBtnRow(wrap) {
    const el = document.createElement('div');
    el.style.cssText = `display:flex; gap:1px;${wrap ? ' flex-wrap:wrap;' : ''}`;
    return el;
}

function mkBtn(text, active, onClick) {
    const el = document.createElement('button');
    el.innerText = text;
    el.onclick = onClick;
    el.style.cssText = `
        font-size:7px; font-weight:${active ? 900 : 500}; padding:2px 0;
        background:${active ? '#1e1b4b' : '#151515'};
        color:${active ? '#818cf8' : '#555'};
        border:1px solid ${active ? '#818cf844' : '#222'};
        border-radius:2px; cursor:pointer; font-family:'JetBrains Mono', monospace;
        line-height:1.1; flex:1; text-align:center; min-width:0; transition:all 0.1s;
    `;
    return el;
}

function mkSep() {
    const el = document.createElement('div');
    el.style.cssText = 'width:1px; height:14px; background:#333; margin:0 2px; flex-shrink:0;';
    return el;
}

function mkMicroLabel(text) {
    const el = document.createElement('span');
    el.style.cssText = 'font-size:6px; color:#444; flex-shrink:0; margin-right:1px;';
    el.innerText = text;
    return el;
}
