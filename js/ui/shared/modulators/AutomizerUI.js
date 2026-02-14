// js/ui/shared/modulators/AutomizerUI.js
// Renders the Automizer-specific rows in the modulation matrix grid.

import { MOD_TYPE } from '../../../modules/modulators/Modulator.js';

/**
 * Render Automizer controls into the grid.
 * Rows: WAVE (miniature waveform display), LOOP (length selector), REC (arm button)
 */
export function renderAutomizerUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    // === ROW 1: WAVE — miniature waveform display ===
    const waveCell = document.createElement('div');
    waveCell.className = `grid-cell ${colorClass}`;
    waveCell.style.padding = '2px';

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 24;
    canvas.style.cssText = 'width:100%; height:24px; border-radius:2px; background:#111;';
    canvas.id = `${idPrefix}-automizer-wave-${slotIndex}`;
    waveCell.appendChild(canvas);

    drawAutomizerWaveform(canvas, mod);
    grid.appendChild(waveCell);

    // === ROW 2: LOOP length selector ===
    const loopCell = document.createElement('div');
    loopCell.className = `grid-cell ${colorClass}`;
    loopCell.style.cssText = 'display:flex; align-items:center; gap:2px; justify-content:center;';

    const sel = document.createElement('select');
    sel.style.cssText = 'background:#1a1a1a; color:#ccc; border:1px solid #333; border-radius:2px; font-size:7px; font-family:monospace; padding:1px 2px; width:90%; cursor:pointer;';
    const presets = [2,3,4,5,6,7,8,10,11,12,13,14,16,17,19,20,23,24,29,31,32,37,41,43,47,48,53,59,61,64,67,71,73,79,83,89,96,97,101,103,107,109,113,127,128];
    for (const v of presets) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v + 's';
        if (v === mod.loopSteps) opt.selected = true;
        sel.appendChild(opt);
    }
    sel.onchange = () => {
        mod.setLoopSteps(parseInt(sel.value));
        drawAutomizerWaveform(canvas, mod);
    };
    loopCell.appendChild(sel);
    grid.appendChild(loopCell);

    // === ROW 3: REC button ===
    const recCell = document.createElement('div');
    recCell.className = `grid-cell ${colorClass}`;
    recCell.style.cssText = 'display:flex; align-items:center; gap:2px; justify-content:center;';

    const recBtn = document.createElement('button');
    recBtn.className = 'wave-btn';
    recBtn.style.cssText = 'font-size:7px; padding:2px 6px; border-radius:2px; cursor:pointer; transition:all 0.15s;';
    updateRecBtn(recBtn, mod);

    recBtn.onclick = () => {
        if (mod.isRecording) {
            mod.stopRecording();
        } else {
            // Arm for recording — actual recording happens when * + drag
            mod._armed = !mod._armed;
        }
        updateRecBtn(recBtn, mod);
        drawAutomizerWaveform(canvas, mod);
        onRender();
    };
    recCell.appendChild(recBtn);

    // Clear button
    const clrBtn = document.createElement('button');
    clrBtn.className = 'wave-btn';
    clrBtn.style.cssText = 'font-size:6px; padding:2px 4px; color:#666; cursor:pointer;';
    clrBtn.textContent = 'CLR';
    clrBtn.onclick = () => {
        mod.clearData();
        mod._armed = false;
        updateRecBtn(recBtn, mod);
        drawAutomizerWaveform(canvas, mod);
    };
    recCell.appendChild(clrBtn);

    grid.appendChild(recCell);
}

function updateRecBtn(btn, mod) {
    if (mod.isRecording) {
        btn.textContent = '⏺ REC';
        btn.style.color = '#ef4444';
        btn.style.borderColor = '#ef4444';
        btn.style.background = '#2a1515';
    } else if (mod._armed) {
        btn.textContent = '● ARM';
        btn.style.color = '#f97316';
        btn.style.borderColor = '#f97316';
        btn.style.background = '#2a1a0a';
    } else {
        btn.textContent = '○ ARM';
        btn.style.color = '#666';
        btn.style.borderColor = '';
        btn.style.background = '';
    }
}

/**
 * Draw the recorded waveform (or dotted line if empty) into the canvas.
 */
export function drawAutomizerWaveform(canvas, mod) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    // Center line
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!mod.data || !mod.hasData) {
        // Empty state: dotted line
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#444';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(mod._armed ? 'ARMED' : 'EMPTY', w / 2, h / 2 + 3);
        return;
    }

    // Draw waveform
    const data = mod.data;
    const len = data.length;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < w; i++) {
        const dataIdx = Math.floor((i / w) * len);
        const val = data[dataIdx]; // -1 to +1
        const y = h / 2 - (val * h * 0.45);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Loop length label
    ctx.fillStyle = '#666';
    ctx.font = '6px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(mod.loopSteps + 's', w - 2, 8);
}
