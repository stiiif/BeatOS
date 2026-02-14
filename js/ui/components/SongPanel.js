// js/ui/components/SongPanel.js
// Song Mode panel — full-width collapsible panel below the header.
// Zoomable timeline, drag-drop from snapshot buttons, editing tools, playhead.

import { SongSequencer } from '../../modules/SongSequencer.js';
import { SNAPSHOT_SLOTS } from '../../modules/SnapshotBank.js';

// Snapshot slot colors (match CSS)
const SLOT_COLORS = [
    '#06b6d4','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#3b82f6','#f97316',
    '#14b8a6','#a855f7','#eab308','#e11d48','#22c55e','#d946ef','#6366f1','#fb923c'
];
const SLOT_BG_COLORS = [
    '#164e63','#4c1d95','#78350f','#7f1d1d','#14532d','#831843','#1e3a5f','#7c2d12',
    '#134e4a','#581c87','#713f12','#881337','#166534','#701a75','#312e81','#9a3412'
];

export class SongPanel {
    constructor(songSequencer, snapshotBank, scheduler) {
        this.seq = songSequencer;
        this.bank = snapshotBank;
        this.scheduler = scheduler;

        // UI state
        this.isOpen = false;
        this.zoom = 1.0;         // 1.0 = fit-to-view
        this.scrollX = 0;
        this.tool = 'draw';      // 'select', 'draw', 'erase'
        this.selectedSlot = -1;  // For draw tool: which snapshot to paint
        this.selectionStart = -1;
        this.selectionEnd = -1;
        this.clipboard = null;
        this._isDragging = false;
        this._dragSlot = -1;     // Drag from header snapshot button

        // DOM refs
        this.panel = null;
        this.canvas = null;
        this.ctx = null;
        this.toolbar = null;
        this._animFrame = null;

        // Layout constants
        this.RULER_H = 32;
        this.CELL_H = 32;
        this.MORPH_H = 12;
        this.PANEL_H = 110;
    }

    // ========================================================================
    // PANEL TOGGLE
    // ========================================================================

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
        }
        return this.isOpen;
    }

    // ========================================================================
    // PANEL CONSTRUCTION
    // ========================================================================

    _ensurePanel() {
        if (this.panel) return;

        this.panel = document.createElement('div');
        this.panel.id = 'songPanel';
        this.panel.className = 'song-panel';
        this.panel.style.display = 'none';

        // Toolbar row
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'song-toolbar';
        this.toolbar.innerHTML = `
            <span class="song-title">SONG MODE</span>
            <div class="song-tools">
                <button data-tool="select" class="song-tool-btn" title="Select (S)"><i class="fas fa-mouse-pointer"></i></button>
                <button data-tool="draw" class="song-tool-btn active" title="Draw (D)"><i class="fas fa-pen"></i></button>
                <button data-tool="erase" class="song-tool-btn" title="Erase (E)"><i class="fas fa-eraser"></i></button>
                <span class="song-sep">|</span>
                <button data-action="copy" class="song-tool-btn" title="Copy (Ctrl+C)"><i class="fas fa-copy"></i></button>
                <button data-action="paste" class="song-tool-btn" title="Paste (Ctrl+V)"><i class="fas fa-paste"></i></button>
                <button data-action="dup" class="song-tool-btn" title="Duplicate (Ctrl+D)"><i class="fas fa-clone"></i></button>
                <button data-action="clearAll" class="song-tool-btn song-tool-danger" title="Clear All"><i class="fas fa-trash"></i></button>
            </div>
            <div class="song-transport">
                <button id="songPlayBtn" class="song-play-btn" title="Play Song"><i class="fas fa-play"></i> SONG</button>
                <button id="songStopBtn" class="song-stop-btn" title="Stop Song"><i class="fas fa-stop"></i></button>
                <span class="song-bar-display">Bar: <span id="songCurrentBar">--</span></span>
            </div>
            <div class="song-length-ctrl">
                <span class="song-len-label">Bars:</span>
                <input type="number" id="songLengthInput" value="64" min="8" max="256" step="8" class="song-len-input">
            </div>
        `;
        this.panel.appendChild(this.toolbar);

        // Canvas for timeline
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'song-canvas';
        this.canvas.height = this.RULER_H + this.CELL_H + this.MORPH_H;
        this.panel.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Insert panel after header
        const header = document.querySelector('header');
        header.parentNode.insertBefore(this.panel, header.nextSibling);

        this._bindEvents();
    }

    // ========================================================================
    // EVENTS
    // ========================================================================

    _bindEvents() {
        // Tool buttons
        this.toolbar.querySelectorAll('.song-tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
        });
        this.toolbar.querySelectorAll('.song-tool-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this._doAction(btn.dataset.action));
        });

        // Transport
        document.getElementById('songPlayBtn').addEventListener('click', () => this._playSong());
        document.getElementById('songStopBtn').addEventListener('click', () => this._stopSong());

        // Length input
        document.getElementById('songLengthInput').addEventListener('change', (e) => {
            this.seq.setLength(parseInt(e.target.value) || 64);
            e.target.value = this.seq.length;
            this.zoom = 1.0;
            this.scrollX = 0;
            this.draw();
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this._onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this._onMouseUp());

        // Wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const oldZoom = this.zoom;

            if (e.deltaY < 0) this.zoom = Math.min(this.zoom * 1.15, 10);
            else this.zoom = Math.max(this.zoom / 1.15, 0.5);

            // Zoom centered on mouse position
            const ratio = this.zoom / oldZoom;
            this.scrollX = mouseX - (mouseX - this.scrollX) * ratio;
            this._clampScroll();
            this.draw();
        }, { passive: false });

        // Drag-drop from snapshot buttons (listen on document for dragover/drop)
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const slotStr = e.dataTransfer.getData('text/plain');
            const slot = parseInt(slotStr);
            if (isNaN(slot) || slot < 0 || slot >= SNAPSHOT_SLOTS) return;
            const bar = this._xToBar(e.offsetX);
            if (bar >= 0 && bar < this.seq.length) {
                this.seq.setBar(bar, slot);
                this.draw();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.target.tagName === 'INPUT') return;

            if (e.key === 's' && !e.ctrlKey) this._setTool('select');
            if (e.key === 'd' && !e.ctrlKey) this._setTool('draw');
            if (e.key === 'e' && !e.ctrlKey) this._setTool('erase');
            if (e.key === 'Delete' || e.key === 'Backspace') this._doAction('eraseSelection');
            if (e.ctrlKey && e.key === 'c') { e.preventDefault(); this._doAction('copy'); }
            if (e.ctrlKey && e.key === 'v') { e.preventDefault(); this._doAction('paste'); }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this._doAction('dup'); }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.isOpen) { this._resizeCanvas(); this.draw(); }
        });
    }

    // ========================================================================
    // TOOL / ACTION HANDLING
    // ========================================================================

    _setTool(tool) {
        this.tool = tool;
        this.toolbar.querySelectorAll('.song-tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        this.canvas.style.cursor = tool === 'select' ? 'default' : tool === 'draw' ? 'crosshair' : 'not-allowed';
    }

    _doAction(action) {
        const s = Math.min(this.selectionStart, this.selectionEnd);
        const e = Math.max(this.selectionStart, this.selectionEnd);
        const hasSelection = s >= 0 && e >= 0;

        switch (action) {
            case 'copy':
                if (hasSelection) this.clipboard = this.seq.copyRange(s, e);
                break;
            case 'paste':
                if (this.clipboard && this.selectionStart >= 0) {
                    this.seq.pasteAt(this.selectionStart, this.clipboard);
                }
                break;
            case 'dup':
                if (hasSelection) this.seq.duplicateRange(s, e);
                break;
            case 'clearAll':
                this.seq.clearAll();
                this.selectionStart = -1;
                this.selectionEnd = -1;
                break;
            case 'eraseSelection':
                if (hasSelection) this.seq.clearRange(s, e);
                break;
        }
        this.draw();
    }

    // ========================================================================
    // MOUSE INTERACTION
    // ========================================================================

    _onMouseDown(e) {
        const bar = this._xToBar(e.offsetX);
        if (bar < 0 || bar >= this.seq.length) return;
        this._isDragging = true;

        switch (this.tool) {
            case 'select':
                if (e.shiftKey && this.selectionStart >= 0) {
                    this.selectionEnd = bar;
                } else {
                    this.selectionStart = bar;
                    this.selectionEnd = bar;
                }
                break;
            case 'draw':
                if (this.selectedSlot >= 0) {
                    this.seq.setBar(bar, this.selectedSlot);
                }
                break;
            case 'erase':
                this.seq.setBar(bar, -1);
                break;
        }
        this.draw();
    }

    _onMouseMove(e) {
        if (!this._isDragging) return;
        const bar = this._xToBar(e.offsetX);
        if (bar < 0 || bar >= this.seq.length) return;

        switch (this.tool) {
            case 'select':
                this.selectionEnd = bar;
                break;
            case 'draw':
                if (this.selectedSlot >= 0) this.seq.setBar(bar, this.selectedSlot);
                break;
            case 'erase':
                this.seq.setBar(bar, -1);
                break;
        }
        this.draw();
    }

    _onMouseUp() {
        this._isDragging = false;
    }

    // ========================================================================
    // COORDINATE CONVERSION
    // ========================================================================

    _cellWidth() {
        return (this.canvas.width / this.seq.length) * this.zoom;
    }

    _xToBar(px) {
        const cw = this._cellWidth();
        return Math.floor((px - this.scrollX) / cw);
    }

    _barToX(bar) {
        return bar * this._cellWidth() + this.scrollX;
    }

    _clampScroll() {
        const totalW = this._cellWidth() * this.seq.length;
        const viewW = this.canvas.width;
        if (totalW <= viewW) {
            this.scrollX = 0;
        } else {
            this.scrollX = Math.min(0, Math.max(viewW - totalW, this.scrollX));
        }
    }

    _resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth - 16; // padding
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
        const cw = this._cellWidth();
        const bpm = this.scheduler ? this.scheduler.getBPM() : 120;
        const numSteps = 32; // Could read from constants

        ctx.clearRect(0, 0, w, h);

        // Determine label interval based on cell width
        let labelEvery = 1;
        if (cw < 18) labelEvery = 8;
        else if (cw < 30) labelEvery = 4;
        else if (cw < 50) labelEvery = 2;

        // --- RULER ---
        for (let i = 0; i < this.seq.length; i++) {
            const x = this._barToX(i);
            if (x + cw < 0 || x > w) continue; // off-screen

            // Background stripe
            ctx.fillStyle = (i % 8 < 4) ? '#1a1a1a' : '#151515';
            ctx.fillRect(x, 0, cw, this.RULER_H);

            // Bar number + time
            if (i % labelEvery === 0) {
                ctx.fillStyle = '#666';
                ctx.font = '9px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(i + 1, x + cw / 2, 11);

                ctx.fillStyle = '#444';
                ctx.font = '8px JetBrains Mono, monospace';
                ctx.fillText(SongSequencer.barTimeString(i, bpm, numSteps), x + cw / 2, 24);
            }

            // Vertical gridline
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // --- CELLS ---
        const cellY = this.RULER_H;
        for (let i = 0; i < this.seq.length; i++) {
            const x = this._barToX(i);
            if (x + cw < 0 || x > w) continue;

            const slot = this.seq.getBar(i);
            const isSelected = this._isInSelection(i);

            // Cell background
            if (slot >= 0) {
                ctx.fillStyle = SLOT_BG_COLORS[slot] || '#164e63';
                ctx.fillRect(x + 1, cellY + 1, cw - 2, this.CELL_H - 2);

                // Label
                if (cw > 14) {
                    ctx.fillStyle = SLOT_COLORS[slot] || '#67e8f9';
                    ctx.font = 'bold 10px JetBrains Mono, monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`S${slot + 1}`, x + cw / 2, cellY + this.CELL_H / 2 + 4);
                }
            } else {
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 1, cellY + 1, cw - 2, this.CELL_H - 2);
            }

            // Selection highlight
            if (isSelected) {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
                ctx.fillRect(x, cellY, cw, this.CELL_H);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, cellY + 1, cw - 2, this.CELL_H - 2);
            }
        }

        // --- MORPH LANE (placeholder for Phase 3) ---
        const morphY = cellY + this.CELL_H;
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, morphY, w, this.MORPH_H);

        // Draw transition markers where snapshot changes
        for (let i = 1; i < this.seq.length; i++) {
            const prev = this.seq.getBar(i - 1);
            const curr = this.seq.getBar(i);
            if (prev >= 0 && curr >= 0 && prev !== curr) {
                const x = this._barToX(i);
                ctx.fillStyle = '#4338ca';
                ctx.fillRect(x - 1, morphY + 2, 3, this.MORPH_H - 4);
            }
        }

        // --- PLAYHEAD ---
        if (this.seq.isPlaying) {
            const px = this._barToX(this.seq.currentBar);
            ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
            ctx.fillRect(px, 0, 2, h);
        }
    }

    _isInSelection(barIndex) {
        if (this.selectionStart < 0 || this.selectionEnd < 0) return false;
        const s = Math.min(this.selectionStart, this.selectionEnd);
        const e = Math.max(this.selectionStart, this.selectionEnd);
        return barIndex >= s && barIndex <= e;
    }

    // ========================================================================
    // SONG TRANSPORT
    // ========================================================================

    _playSong() {
        this.seq.startPlayback();
        // Also start the main loop sequencer if not running
        if (this.scheduler && !this.scheduler.getIsPlaying()) {
            document.getElementById('playBtn')?.click();
        }
        this.draw();
        this._startPlayheadAnimation();
    }

    _stopSong() {
        this.seq.stopPlayback();
        document.getElementById('songCurrentBar').textContent = '--';
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

    // ========================================================================
    // SNAPSHOT SELECTION (for draw tool)
    // ========================================================================

    setSelectedSlot(slot) {
        this.selectedSlot = slot;
    }

    // ========================================================================
    // DRAG-DROP SUPPORT (from header snapshot buttons)
    // ========================================================================

    /** Call this to make snapshot buttons draggable into the timeline */
    enableDragFromButtons(snapshotBankUI) {
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            const btn = snapshotBankUI.getSlotButton(i);
            if (!btn) continue;
            btn.draggable = true;
            btn.addEventListener('dragstart', (e) => {
                if (!this.bank.isOccupied(i)) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', String(i));
                e.dataTransfer.effectAllowed = 'copy';
            });
        }
    }

    // ========================================================================
    // SERIALIZE (included in project save)
    // ========================================================================

    serialize() {
        return this.seq.serialize();
    }

    deserialize(obj) {
        this.seq.deserialize(obj);
        if (this.isOpen) {
            document.getElementById('songLengthInput').value = this.seq.length;
            this.zoom = 1.0;
            this.scrollX = 0;
            this.draw();
        }
    }
}
