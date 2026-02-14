// js/ui/components/SongPanel.js
// Song Mode panel — sub-bar resolution timeline with draggable region edges.
// 16 subdivisions per bar (1/16 note). Zoom reveals subdivisions.

import { SongSequencer, SUBDIV_PER_BAR } from '../../modules/SongSequencer.js';
import { SNAPSHOT_SLOTS } from '../../modules/SnapshotBank.js';

const SLOT_COLORS = [
    '#06b6d4','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#3b82f6','#f97316',
    '#14b8a6','#a855f7','#eab308','#e11d48','#22c55e','#d946ef','#6366f1','#fb923c'
];
const SLOT_BG_COLORS = [
    '#164e63','#4c1d95','#78350f','#7f1d1d','#14532d','#831843','#1e3a5f','#7c2d12',
    '#134e4a','#581c87','#713f12','#881337','#166534','#701a75','#312e81','#9a3412'
];
const CURVE_ICONS = { 'linear':'╱', 'ease-in':'╰', 'ease-out':'╮', 'ease-in-out':'∿' };
const NUM_STEPS = 32;
const EDGE_HIT = 6; // px hit zone for region edge drag

export class SongPanel {
    constructor(songSequencer, snapshotBank, scheduler) {
        this.seq = songSequencer;
        this.bank = snapshotBank;
        this.scheduler = scheduler;

        this.isOpen = false;
        this.zoom = 1.0;
        this.scrollX = 0;
        this.tool = 'draw';
        this.selectedSlot = -1;
        this.selectionStart = -1; // bar index
        this.selectionEnd = -1;
        this.clipboard = null;
        this._isDragging = false;
        this.showMorph = true;

        // Region edge dragging
        this._edgeDrag = null; // { region, edge:'start'|'end', origCell }

        // Move tool dragging
        this._moveDrag = null; // { startBar, startMouseBar }

        // Morph lane dragging
        this._morphDragCell = -1;
        this._morphDragging = false;
        this._morphDragStartX = 0;

        this._ctxMenu = null;
        this.panel = null;
        this.canvas = null;
        this.ctx = null;
        this.toolbar = null;
        this._animFrame = null;
        this._morphEngine = null;

        this.RULER_H = 32;
        this.CELL_H = 32;
        this.MORPH_H = 20;
        this.PANEL_H = 120;
    }

    setMorphEngine(me) { this._morphEngine = me; }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this._ensurePanel();
            this.panel.style.display = 'block';
            this.panel.style.height = this.PANEL_H + 'px';
            this._resizeCanvas();
            this.draw();
        } else {
            if (this.panel) this.panel.style.display = 'none';
            this._hideCtxMenu();
        }
        return this.isOpen;
    }

    _ensurePanel() {
        if (this.panel) return;
        this.panel = document.createElement('div');
        this.panel.id = 'songPanel';
        this.panel.className = 'song-panel';
        this.panel.style.display = 'none';

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'song-toolbar';
        this.toolbar.innerHTML = `
            <span class="song-title">SONG MODE</span>
            <div class="song-tools">
                <button data-tool="select" class="song-tool-btn" title="Select (S)"><i class="fas fa-mouse-pointer"></i></button>
                <button data-tool="draw" class="song-tool-btn active" title="Draw (D)"><i class="fas fa-pen"></i></button>
                <button data-tool="erase" class="song-tool-btn" title="Erase (E)"><i class="fas fa-eraser"></i></button>
                <button data-tool="move" class="song-tool-btn" title="Move (M)"><i class="fas fa-arrows-alt-h"></i></button>
                <span class="song-sep">|</span>
                <button data-action="copy" class="song-tool-btn" title="Copy (Ctrl+C)"><i class="fas fa-copy"></i></button>
                <button data-action="paste" class="song-tool-btn" title="Paste (Ctrl+V)"><i class="fas fa-paste"></i></button>
                <button data-action="dup" class="song-tool-btn" title="Duplicate (Ctrl+D)"><i class="fas fa-clone"></i></button>
                <button data-action="clearAll" class="song-tool-btn song-tool-danger" title="Clear All"><i class="fas fa-trash"></i></button>
            </div>
            <div class="song-morph-toggle">
                <label class="song-checkbox-label"><input type="checkbox" id="showMorphCb" checked><span>Show Morph</span></label>
            </div>
            <div class="song-transport">
                <span class="song-bar-display">Bar: <span id="songCurrentBar">--</span></span>
            </div>
            <div class="song-length-ctrl">
                <span class="song-len-label">Bars:</span>
                <input type="number" id="songLengthInput" value="64" min="8" max="256" step="8" class="song-len-input">
            </div>
        `;
        this.panel.appendChild(this.toolbar);

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'song-canvas';
        this.canvas.height = this.RULER_H + this.CELL_H + this.MORPH_H;
        this.panel.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this._ctxMenu = document.createElement('div');
        this._ctxMenu.className = 'song-ctx-menu';
        this._ctxMenu.style.display = 'none';
        this.panel.appendChild(this._ctxMenu);

        const header = document.querySelector('header');
        header.parentNode.insertBefore(this.panel, header.nextSibling);
        this._bindEvents();
    }

    // ========================================================================
    // EVENTS
    // ========================================================================

    _bindEvents() {
        this.toolbar.querySelectorAll('.song-tool-btn[data-tool]').forEach(b => b.addEventListener('click', () => this._setTool(b.dataset.tool)));
        this.toolbar.querySelectorAll('.song-tool-btn[data-action]').forEach(b => b.addEventListener('click', () => this._doAction(b.dataset.action)));
        document.getElementById('showMorphCb').addEventListener('change', e => { this.showMorph = e.target.checked; });
        document.getElementById('songLengthInput').addEventListener('change', e => {
            this.seq.setLength(parseInt(e.target.value) || 64);
            e.target.value = this.seq.length;
            this.zoom = 1.0; this.scrollX = 0; this.draw();
        });

        this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this._onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this._onMouseUp());

        this.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            const cell = this._xToCell(e.offsetX);
            const y = e.offsetY;
            if (y >= this.RULER_H + this.CELL_H) {
                const tp = this._findTransitionNear(cell);
                if (tp) { this._showCtxMenu(e.offsetX, e.offsetY, tp.cell); return; }
            }
            this._hideCtxMenu();
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const oldZoom = this.zoom;
            if (e.deltaY < 0) this.zoom = Math.min(this.zoom * 1.15, 20);
            else this.zoom = Math.max(this.zoom / 1.15, 0.5);
            const ratio = this.zoom / oldZoom;
            this.scrollX = mouseX - (mouseX - this.scrollX) * ratio;
            this._clampScroll(); this.draw();
        }, { passive: false });

        this.canvas.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        this.canvas.addEventListener('drop', e => {
            e.preventDefault();
            const slot = parseInt(e.dataTransfer.getData('text/plain'));
            if (isNaN(slot) || slot < 0 || slot >= SNAPSHOT_SLOTS) return;
            const bar = this._xToBar(e.offsetX);
            if (bar >= 0 && bar < this.seq.length) { this.seq.setBar(bar, slot); this.draw(); }
        });

        document.addEventListener('keydown', e => {
            if (!this.isOpen || e.target.tagName === 'INPUT') return;
            if (e.key === 's' && !e.ctrlKey) { e.preventDefault(); this._setTool('select'); }
            if (e.key === 'd' && !e.ctrlKey) { e.preventDefault(); this._setTool('draw'); }
            if (e.key === 'e' && !e.ctrlKey) { e.preventDefault(); this._setTool('erase'); }
            if (e.key === 'm' && !e.ctrlKey) { e.preventDefault(); this._setTool('move'); }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this._doAction('eraseSelection'); }
            if (e.ctrlKey && e.key === 'c') { e.preventDefault(); this._doAction('copy'); }
            if (e.ctrlKey && e.key === 'v') { e.preventDefault(); this._doAction('paste'); }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this._doAction('dup'); }
        });

        document.addEventListener('mousedown', e => {
            if (this._ctxMenu && !this._ctxMenu.contains(e.target)) this._hideCtxMenu();
        });
        window.addEventListener('resize', () => { if (this.isOpen) { this._resizeCanvas(); this.draw(); } });
    }

    _setTool(tool) {
        this.tool = tool;
        this.toolbar.querySelectorAll('.song-tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    }

    _doAction(action) {
        const s = Math.min(this.selectionStart, this.selectionEnd);
        const e = Math.max(this.selectionStart, this.selectionEnd);
        const has = s >= 0 && e >= 0;
        switch (action) {
            case 'copy': if (has) this.clipboard = this.seq.copyBarRange(s, e); break;
            case 'paste': if (this.clipboard && this.selectionStart >= 0) this.seq.pasteAtBar(this.selectionStart, this.clipboard); break;
            case 'dup':
                if (has) {
                    const newStart = this.seq.duplicateBarRange(s, e);
                    const rangeLen = e - s;
                    // Auto-select the newly duplicated range
                    this.selectionStart = newStart;
                    this.selectionEnd = newStart + rangeLen;
                }
                break;
            case 'clearAll': this.seq.clearAll(); this.selectionStart = -1; this.selectionEnd = -1; break;
            case 'eraseSelection': if (has) this.seq.clearBarRange(s, e); break;
        }
        this.draw();
    }

    // ========================================================================
    // MOUSE — region edge drag + tools + morph drag
    // ========================================================================

    _onMouseDown(e) {
        this._hideCtxMenu();
        const px = e.offsetX;
        const y = e.offsetY;
        const cellY = this.RULER_H;
        const morphY = cellY + this.CELL_H;

        // Click on ruler area → seek to that bar
        if (y < cellY) {
            const bar = this._xToBar(px);
            if (bar >= 0 && bar < this.seq.length) {
                this._seekToBar(bar);
            }
            return;
        }

        // Check morph lane click
        if (y >= morphY && y <= morphY + this.MORPH_H) {
            const cell = this._xToCell(px);
            const tp = this._findTransitionNear(cell);
            if (tp && e.button === 0) {
                this._morphDragging = true;
                this._morphDragCell = tp.cell;
                this._morphDragStartX = px;
                return;
            }
        }

        // Check region edge drag (cell area)
        if (y >= cellY && y < morphY) {
            const edgeInfo = this._hitTestRegionEdge(px);
            if (edgeInfo) {
                this._edgeDrag = edgeInfo;
                return;
            }

            // Normal tool behavior
            const bar = this._xToBar(px);
            if (bar < 0 || bar >= this.seq.length) return;
            this._isDragging = true;

            switch (this.tool) {
                case 'select':
                    if (e.shiftKey && this.selectionStart >= 0) this.selectionEnd = bar;
                    else { this.selectionStart = bar; this.selectionEnd = bar; }
                    break;
                case 'draw':
                    if (this.selectedSlot >= 0) this.seq.setBar(bar, this.selectedSlot);
                    break;
                case 'erase':
                    this.seq.setBar(bar, -1);
                    break;
                case 'move':
                    // Start moving the selection or the region under cursor
                    if (this.selectionStart >= 0 && this.selectionEnd >= 0 &&
                        bar >= Math.min(this.selectionStart, this.selectionEnd) &&
                        bar <= Math.max(this.selectionStart, this.selectionEnd)) {
                        // Move entire selection
                        this._moveDrag = { startBar: Math.min(this.selectionStart, this.selectionEnd), startMouseBar: bar };
                    } else {
                        // Select the region under cursor for moving
                        const cell = bar * SUBDIV_PER_BAR;
                        const region = this.seq.getRegionAt(cell);
                        if (region) {
                            const rStartBar = Math.floor(region.start / SUBDIV_PER_BAR);
                            const rEndBar = Math.floor(region.end / SUBDIV_PER_BAR);
                            this.selectionStart = rStartBar;
                            this.selectionEnd = rEndBar;
                            this._moveDrag = { startBar: rStartBar, startMouseBar: bar };
                        }
                    }
                    break;
            }
        }
        this.draw();
    }

    _onMouseMove(e) {
        const px = e.offsetX;
        const y = e.offsetY;

        // Region edge drag
        if (this._edgeDrag) {
            const cell = this._xToCell(px);
            const snapped = this._snapToCell(cell);
            if (this._edgeDrag.edge === 'start') {
                this.seq.moveRegionStart(this._edgeDrag.region, snapped);
                this._edgeDrag.region = this.seq.getRegionAt(snapped) || this._edgeDrag.region;
            } else {
                this.seq.moveRegionEnd(this._edgeDrag.region, snapped);
                this._edgeDrag.region = this.seq.getRegionAt(snapped) || this._edgeDrag.region;
            }
            this.draw();
            return;
        }

        // Morph drag
        if (this._morphDragging && this._morphDragCell >= 0) {
            const cw = this._subdivWidth();
            const deltaCells = (px - this._morphDragStartX) / cw;
            const deltaSteps = Math.round(deltaCells * (NUM_STEPS / SUBDIV_PER_BAR));
            const current = this.seq.getTransition(this._morphDragCell);
            const baseDur = current ? current.durationSteps : 0;
            const newDur = Math.max(0, Math.min(256, baseDur + deltaSteps));
            if (newDur !== baseDur) {
                const curve = current ? current.curve : 'linear';
                if (newDur === 0) this.seq.removeTransition(this._morphDragCell);
                else this.seq.setTransition(this._morphDragCell, newDur, curve);
                this._morphDragStartX = px;
                this.draw();
            }
            return;
        }

        // Move drag
        if (this._moveDrag) {
            const bar = this._xToBar(px);
            const delta = bar - this._moveDrag.startMouseBar;
            if (delta !== 0) {
                const s = Math.min(this.selectionStart, this.selectionEnd);
                const e = Math.max(this.selectionStart, this.selectionEnd);
                const newStart = this.seq.moveBarRange(s, e, delta);
                const rangeLen = e - s;
                this.selectionStart = newStart;
                this.selectionEnd = newStart + rangeLen;
                this._moveDrag.startMouseBar = bar;
                this.draw();
            }
            return;
        }

        if (!this._isDragging) {
            // Hover: check for edge cursor
            const cellY = this.RULER_H;
            if (y >= cellY && y < cellY + this.CELL_H) {
                const edgeInfo = this._hitTestRegionEdge(px);
                this.canvas.style.cursor = edgeInfo ? 'ew-resize' :
                    this.tool === 'draw' ? 'crosshair' :
                    this.tool === 'erase' ? 'not-allowed' :
                    this.tool === 'move' ? 'grab' : 'default';
            } else if (y >= cellY + this.CELL_H) {
                const cell = this._xToCell(px);
                const tp = this._findTransitionNear(cell);
                this.canvas.style.cursor = tp ? 'ew-resize' : 'default';
            } else if (y < cellY) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'default';
            }
            return;
        }

        const bar = this._xToBar(px);
        if (bar < 0 || bar >= this.seq.length) return;
        switch (this.tool) {
            case 'select': this.selectionEnd = bar; break;
            case 'draw': if (this.selectedSlot >= 0) this.seq.setBar(bar, this.selectedSlot); break;
            case 'erase': this.seq.setBar(bar, -1); break;
        }
        this.draw();
    }

    _onMouseUp() {
        this._isDragging = false;
        this._edgeDrag = null;
        this._moveDrag = null;
        this._morphDragging = false;
        this._morphDragCell = -1;
    }

    /** Hit-test for region edge at a given pixel X. Returns { region, edge } or null */
    _hitTestRegionEdge(px) {
        const regions = this.seq.getRegions();
        for (const r of regions) {
            const startX = this._cellToX(r.start);
            const endX = this._cellToX(r.end + 1);
            if (Math.abs(px - startX) < EDGE_HIT) return { region: r, edge: 'start' };
            if (Math.abs(px - endX) < EDGE_HIT) return { region: r, edge: 'end' };
        }
        return null;
    }

    _snapToCell(cellFloat) {
        return Math.max(0, Math.min(this.seq.totalCells - 1, Math.round(cellFloat)));
    }

    _findTransitionNear(cell) {
        const points = this.seq.getTransitionPoints();
        for (const tp of points) {
            const trans = this.seq.getTransition(tp.cell);
            const morphCells = trans ? Math.ceil(trans.durationSteps / (NUM_STEPS / SUBDIV_PER_BAR)) : 0;
            if (cell >= tp.cell - 1 && cell <= tp.cell + morphCells) return tp;
        }
        return null;
    }

    // ========================================================================
    // CONTEXT MENU
    // ========================================================================

    _showCtxMenu(x, y, transitionCell) {
        const trans = this.seq.getTransition(transitionCell);
        const dur = trans ? trans.durationSteps : 0;
        const curve = trans ? trans.curve : 'linear';
        this._ctxMenu.innerHTML = `
            <div class="ctx-section"><div class="ctx-label">Duration</div>
                <div class="ctx-row">
                    <button data-dur="0" class="ctx-btn ${dur===0?'ctx-active':''}">Instant</button>
                    <button data-dur="1" class="ctx-btn ${dur===1?'ctx-active':''}">1 stp</button>
                    <button data-dur="4" class="ctx-btn ${dur===4?'ctx-active':''}">4 stp</button>
                </div><div class="ctx-row">
                    <button data-dur="${NUM_STEPS}" class="ctx-btn ${dur===NUM_STEPS?'ctx-active':''}">1 bar</button>
                    <button data-dur="${NUM_STEPS*2}" class="ctx-btn ${dur===NUM_STEPS*2?'ctx-active':''}">2 bars</button>
                    <button data-dur="${NUM_STEPS*4}" class="ctx-btn ${dur===NUM_STEPS*4?'ctx-active':''}">4 bars</button>
                </div></div>
            <div class="ctx-section"><div class="ctx-label">Curve</div><div class="ctx-row">
                <button data-curve="linear" class="ctx-btn ${curve==='linear'?'ctx-active':''}">╱ Lin</button>
                <button data-curve="ease-in" class="ctx-btn ${curve==='ease-in'?'ctx-active':''}">╰ eIn</button>
                <button data-curve="ease-out" class="ctx-btn ${curve==='ease-out'?'ctx-active':''}">╮ eOut</button>
                <button data-curve="ease-in-out" class="ctx-btn ${curve==='ease-in-out'?'ctx-active':''}">∿ S</button>
            </div></div>`;
        this._ctxMenu.style.left = x + 'px';
        this._ctxMenu.style.top = (y - 100) + 'px';
        this._ctxMenu.style.display = 'block';
        this._ctxMenu.querySelectorAll('[data-dur]').forEach(b => b.addEventListener('click', () => {
            const d = parseInt(b.dataset.dur);
            if (d === 0) this.seq.removeTransition(transitionCell); else this.seq.setTransition(transitionCell, d, curve);
            this._hideCtxMenu(); this.draw();
        }));
        this._ctxMenu.querySelectorAll('[data-curve]').forEach(b => b.addEventListener('click', () => {
            const t = this.seq.getTransition(transitionCell); const d = t ? t.durationSteps : NUM_STEPS;
            this.seq.setTransition(transitionCell, d, b.dataset.curve); this._hideCtxMenu(); this.draw();
        }));
    }

    _hideCtxMenu() { if (this._ctxMenu) this._ctxMenu.style.display = 'none'; }

    // ========================================================================
    // COORDINATES (cell = subdivision level)
    // ========================================================================

    _subdivWidth() { return (this.canvas.width / this.seq.totalCells) * this.zoom; }
    _barWidth() { return this._subdivWidth() * SUBDIV_PER_BAR; }
    _xToCell(px) { return Math.floor((px - this.scrollX) / this._subdivWidth()); }
    _xToBar(px) { return Math.floor(this._xToCell(px) / SUBDIV_PER_BAR); }
    _cellToX(cell) { return cell * this._subdivWidth() + this.scrollX; }
    _barToX(bar) { return this._cellToX(bar * SUBDIV_PER_BAR); }

    _clampScroll() {
        const totalW = this._subdivWidth() * this.seq.totalCells;
        const viewW = this.canvas.width;
        if (totalW <= viewW) this.scrollX = 0;
        else this.scrollX = Math.min(0, Math.max(viewW - totalW, this.scrollX));
    }

    _resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth - 16;
        this.canvas.height = this.RULER_H + this.CELL_H + this.MORPH_H;
        this._clampScroll();
    }

    // ========================================================================
    // DRAWING
    // ========================================================================

    draw() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const bw = this._barWidth();
        const sw = this._subdivWidth();
        const bpm = this.scheduler ? this.scheduler.getBPM() : 120;

        ctx.clearRect(0, 0, w, h);

        // Adaptive label interval
        let labelEvery = 1;
        if (bw < 18) labelEvery = 8;
        else if (bw < 30) labelEvery = 4;
        else if (bw < 50) labelEvery = 2;

        // --- RULER ---
        for (let i = 0; i < this.seq.length; i++) {
            const x = this._barToX(i);
            if (x + bw < 0 || x > w) continue;
            ctx.fillStyle = (i % 8 < 4) ? '#1a1a1a' : '#151515';
            ctx.fillRect(x, 0, bw, this.RULER_H);

            if (i % labelEvery === 0) {
                ctx.fillStyle = '#666'; ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign = 'center';
                ctx.fillText(i + 1, x + bw / 2, 11);
                ctx.fillStyle = '#444'; ctx.font = '8px JetBrains Mono, monospace';
                ctx.fillText(SongSequencer.barTimeString(i, bpm, NUM_STEPS), x + bw / 2, 24);
            }

            // Bar gridline
            ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();

            // Sub-division gridlines when zoomed in
            if (sw > 6) {
                ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
                for (let s = 1; s < SUBDIV_PER_BAR; s++) {
                    const sx = x + s * sw;
                    if (s % 4 === 0) { ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8; }
                    else { ctx.strokeStyle = '#161616'; ctx.lineWidth = 0.4; }
                    ctx.beginPath(); ctx.moveTo(sx, this.RULER_H); ctx.lineTo(sx, this.RULER_H + this.CELL_H); ctx.stroke();
                }
            }
        }

        // --- REGIONS (snapshot blocks) ---
        const cellY = this.RULER_H;
        const regions = this.seq.getRegions();
        for (const r of regions) {
            const x1 = this._cellToX(r.start);
            const x2 = this._cellToX(r.end + 1);
            if (x2 < 0 || x1 > w) continue;

            const rw = x2 - x1;
            ctx.fillStyle = SLOT_BG_COLORS[r.slot] || '#164e63';
            ctx.fillRect(x1 + 1, cellY + 1, rw - 2, this.CELL_H - 2);

            // Label
            if (rw > 20) {
                ctx.fillStyle = SLOT_COLORS[r.slot] || '#67e8f9';
                ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
                ctx.fillText(`S${r.slot + 1}`, x1 + rw / 2, cellY + this.CELL_H / 2 + 4);
            }

            // Edge handles (visible when zoomed enough)
            if (sw > 3) {
                ctx.fillStyle = SLOT_COLORS[r.slot] + '88';
                ctx.fillRect(x1, cellY + 2, 3, this.CELL_H - 4);
                ctx.fillRect(x2 - 3, cellY + 2, 3, this.CELL_H - 4);
            }
        }

        // Empty cells background
        ctx.fillStyle = '#111';
        for (let i = 0; i < this.seq.totalCells; i++) {
            if (this.seq.cells[i] < 0) {
                const x = this._cellToX(i);
                if (x + sw < 0 || x > w) continue;
                ctx.fillRect(x + 0.5, cellY + 1, sw - 1, this.CELL_H - 2);
            }
        }

        // Selection highlight (bar-level)
        if (this.selectionStart >= 0 && this.selectionEnd >= 0) {
            const s = Math.min(this.selectionStart, this.selectionEnd);
            const e = Math.max(this.selectionStart, this.selectionEnd);
            for (let b = s; b <= e; b++) {
                const x = this._barToX(b);
                if (x + bw < 0 || x > w) continue;
                ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
                ctx.fillRect(x, cellY, bw, this.CELL_H);
                ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 0.5, cellY + 0.5, bw - 1, this.CELL_H - 1);
            }
        }

        // --- MORPH LANE ---
        const morphY = cellY + this.CELL_H;
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, morphY, w, this.MORPH_H);

        const points = this.seq.getTransitionPoints();
        for (const tp of points) {
            const x = this._cellToX(tp.cell);
            if (x < -bw * 8 || x > w + bw * 8) continue;
            const trans = this.seq.getTransition(tp.cell);
            const dur = trans ? trans.durationSteps : 0;
            const curve = trans ? trans.curve : 'linear';

            if (dur > 0) {
                const morphW = (dur / NUM_STEPS) * bw;
                const grad = ctx.createLinearGradient(x, 0, x + morphW, 0);
                grad.addColorStop(0, (SLOT_COLORS[tp.fromSlot]||'#666') + '66');
                grad.addColorStop(1, (SLOT_COLORS[tp.toSlot]||'#666') + '66');
                ctx.fillStyle = grad;
                ctx.fillRect(x, morphY + 1, morphW, this.MORPH_H - 2);
                ctx.strokeStyle = '#4338ca'; ctx.lineWidth = 1;
                ctx.strokeRect(x, morphY + 1, morphW, this.MORPH_H - 2);
                if (bw > 20) {
                    const label = SongSequencer.formatDuration(dur, NUM_STEPS);
                    ctx.fillStyle = '#a5b4fc'; ctx.font = '8px JetBrains Mono, monospace'; ctx.textAlign = 'center';
                    ctx.fillText(`${CURVE_ICONS[curve]||''} ${label}`, x + morphW/2, morphY + this.MORPH_H - 4);
                }
                ctx.fillStyle = '#6366f1';
                ctx.fillRect(x + morphW - 3, morphY + 2, 4, this.MORPH_H - 4);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x - 1, morphY + 3, 3, this.MORPH_H - 6);
            }
        }

        // --- PLAYHEAD ---
        if (this.seq.isPlaying) {
            const px = this._cellToX(this.seq.currentCell);
            ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
            ctx.fillRect(px, 0, 2, h);
            if (this._morphEngine && this._morphEngine.active && this.showMorph) {
                ctx.fillStyle = '#818cf8';
                ctx.fillRect(px, morphY + this.MORPH_H - 3, sw * 2 * this._morphEngine.fraction, 3);
            }
        }
    }

    // ========================================================================
    // TRANSPORT
    // ========================================================================

    _playSong() {
        this.seq.startPlayback();
        if (this.scheduler && !this.scheduler.getIsPlaying()) document.getElementById('playBtn')?.click();
        this.draw();
        this._startPlayheadAnimation();
    }

    _stopSong() {
        this.seq.stopPlayback();
        document.getElementById('songCurrentBar').textContent = '--';
        this.draw();
    }

    /**
     * Seek to a specific bar — works both while playing and while stopped.
     * Resets the scheduler step counter to align with the new position.
     */
    _seekToBar(bar) {
        this.seq.seekToBar(bar);

        // Reset scheduler step to start of bar so sequencer aligns
        if (this.scheduler) {
            this.scheduler.resetStep(0);
            if (this.scheduler.totalStepsPlayed !== undefined) {
                // Approximate global step position for the bar
                this.scheduler.totalStepsPlayed = bar * NUM_STEPS;
            }
        }

        // If not playing, start playback from this position
        if (!this.seq.isPlaying) {
            this.seq.isPlaying = true;
            if (this.scheduler && !this.scheduler.getIsPlaying()) {
                document.getElementById('playBtn')?.click();
            }
            this._startPlayheadAnimation();
        }

        document.getElementById('songCurrentBar').textContent = bar + 1;
        this.draw();
    }

    _startPlayheadAnimation() {
        const animate = () => {
            if (!this.seq.isPlaying) return;
            document.getElementById('songCurrentBar').textContent = this.seq.currentBar + 1;
            this.draw();
            this._animFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    setSelectedSlot(slot) { this.selectedSlot = slot; }

    enableDragFromButtons(snapshotBankUI) {
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            const btn = snapshotBankUI.getSlotButton(i);
            if (!btn) continue;
            btn.draggable = true;
            btn.addEventListener('dragstart', e => {
                if (!this.bank.isOccupied(i)) { e.preventDefault(); return; }
                e.dataTransfer.setData('text/plain', String(i));
                e.dataTransfer.effectAllowed = 'copy';
            });
        }
    }

    serialize() { return this.seq.serialize(); }
    deserialize(obj) {
        this.seq.deserialize(obj);
        if (this.isOpen) {
            document.getElementById('songLengthInput').value = this.seq.length;
            this.zoom = 1.0; this.scrollX = 0; this.draw();
        }
    }
}
