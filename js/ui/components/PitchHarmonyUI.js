// js/ui/components/PitchHarmonyUI.js
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
        if (!track || track.type !== 'granular') { container.innerHTML = ''; return; }

        container.innerHTML = '';
        const p = track.params;

        // ═══ Wrapper with subtle border ═══
        const wrap = document.createElement('div');
        wrap.style.cssText = 'border:1px solid #2a2a2a; border-radius:4px; padding:4px 6px; margin:4px 0;';

        // ═══ ROW 1: SCALE — [♪] [Root▾] [Scale▾] ═══
        const r1 = mkRow();

        const snapBtn = document.createElement('button');
        snapBtn.className = `wave-btn ${p.pitchSnap ? 'active' : ''}`;
        snapBtn.innerText = '♪';
        snapBtn.title = p.pitchSnap ? 'Snap: ON' : 'Snap: OFF';
        snapBtn.style.cssText = 'font-size:10px; padding:1px 5px; cursor:pointer; flex:0 0 auto; min-width:20px;';
        snapBtn.onclick = () => { p.pitchSnap = !p.pitchSnap; this.render(); };
        r1.appendChild(snapBtn);

        r1.appendChild(mkSelect(
            NOTE_NAMES.map((n, i) => [i, n]), p.scaleRoot,
            v => { p.scaleRoot = parseInt(v); }, '42px'
        ));

        r1.appendChild(mkSelect(
            Object.entries(SCALE_NAMES).map(([id, name]) => [id, name]), p.scaleType,
            v => { p.scaleType = v; }, null, '1'
        ));

        wrap.appendChild(r1);

        // ═══ ROW 2: CHORD — compact button grid 4×2 ═══
        const r2 = mkRow();
        r2.style.gap = '1px';
        r2.style.flexWrap = 'wrap';

        const allChords = Object.keys(CHORD_NAMES);
        allChords.forEach(id => {
            const btn = document.createElement('button');
            btn.className = `wave-btn ${p.chordType === id ? 'active' : ''}`;
            btn.innerText = CHORD_NAMES[id];
            btn.style.cssText = 'font-size:7px; padding:1px 3px; cursor:pointer; line-height:1.2;';
            btn.onclick = () => { p.chordType = id; this.render(); };
            r2.appendChild(btn);
        });

        wrap.appendChild(r2);

        // ═══ ROW 3: VOICE (only when chord ≠ unison) ═══
        if (p.chordType !== 'unison') {
            const r3 = mkRow();

            // Voice mode buttons
            VOICE_MODES.forEach(mode => {
                const btn = document.createElement('button');
                btn.className = `wave-btn ${p.voiceMode === mode ? 'active' : ''}`;
                btn.innerText = mode.substring(0, 3).toUpperCase();
                btn.style.cssText = 'font-size:7px; padding:1px 4px; cursor:pointer;';
                btn.onclick = () => { p.voiceMode = mode; this.render(); };
                r3.appendChild(btn);
            });

            // Spread
            r3.appendChild(mkLabel('SPR'));
            const spr = mkSlider(0, 3, 1, p.chordSpread, v => { p.chordSpread = v; });
            spr.style.flex = '1';
            spr.title = `${p.chordSpread} oct`;
            r3.appendChild(spr);

            // Inversion
            r3.appendChild(mkLabel('INV'));
            for (let i = 0; i < 4; i++) {
                const btn = document.createElement('button');
                btn.className = `wave-btn ${p.chordInversion === i ? 'active' : ''}`;
                btn.innerText = String(i);
                btn.style.cssText = 'font-size:7px; padding:1px 3px; cursor:pointer; min-width:14px; text-align:center;';
                btn.onclick = () => { p.chordInversion = i; this.render(); };
                r3.appendChild(btn);
            }

            wrap.appendChild(r3);
        }

        container.appendChild(wrap);
    }
}

// ═══ Helpers ═══
function mkRow() {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex; align-items:center; gap:3px; margin-bottom:3px;';
    return d;
}

function mkLabel(text) {
    const s = document.createElement('span');
    s.style.cssText = 'font-size:7px; color:#555; margin-left:2px; white-space:nowrap;';
    s.innerText = text;
    return s;
}

function mkSelect(options, current, setter, width, flex) {
    const sel = document.createElement('select');
    sel.style.cssText = `background:#141414; color:#aaa; border:1px solid #333; font-size:8px; padding:1px 2px; border-radius:3px;${width ? ` width:${width};` : ''}${flex ? ` flex:${flex};` : ''}`;
    options.forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value; opt.innerText = label;
        if (String(value) === String(current)) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = e => setter(e.target.value);
    return sel;
}

function mkSlider(min, max, step, value, setter) {
    const input = document.createElement('input');
    input.type = 'range'; input.className = 'micro-slider';
    input.min = min; input.max = max; input.step = step; input.value = value;
    input.oninput = e => setter(parseInt(e.target.value));
    return input;
}
