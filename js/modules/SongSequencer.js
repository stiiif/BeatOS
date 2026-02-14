// js/modules/SongSequencer.js
// Song Mode data model and playback engine.
//
// Resolution: 16 subdivisions per bar (= 1/16 note in a 32-step bar).
// The `cells` array stores snapshot slot per subdivision.
// Drawing/editing at bar level when zoomed out, 1/16 level when zoomed in.
// Regions are contiguous runs of the same snapshot, with draggable edges.

export const SUBDIV_PER_BAR = 16; // 1/16 note resolution
const MAX_BARS = 256;
const MAX_CELLS = MAX_BARS * SUBDIV_PER_BAR;

export class SongSequencer {
    constructor() {
        this.length = 64;                          // Song length in bars
        this.cells = new Int8Array(MAX_CELLS).fill(-1); // -1 = empty, 0–15 = slot
        this.transitions = {};                     // { [cellIndex]: { durationSteps, curve } }

        this.isPlaying = false;
        this.currentCell = 0;   // Playback position in cells (subdivisions)
        this.lastRecalledSlot = -1;

        this._snapshotBank = null;
        this._scheduler = null;
        this._morphEngine = null;
        this._onBarChange = null;
        this._onSongStop = null;
    }

    get totalCells() { return this.length * SUBDIV_PER_BAR; }
    get currentBar() { return Math.floor(this.currentCell / SUBDIV_PER_BAR); }

    setContext({ snapshotBank, scheduler, morphEngine }) {
        this._snapshotBank = snapshotBank;
        this._scheduler = scheduler;
        this._morphEngine = morphEngine;
    }

    setCallbacks({ onBarChange, onSongStop }) {
        this._onBarChange = onBarChange;
        this._onSongStop = onSongStop;
    }

    // ========================================================================
    // DATA MODEL — cell level
    // ========================================================================

    getCell(cellIndex) {
        if (cellIndex < 0 || cellIndex >= this.totalCells) return -1;
        return this.cells[cellIndex];
    }

    setCell(cellIndex, slot) {
        if (cellIndex < 0 || cellIndex >= this.totalCells) return;
        this.cells[cellIndex] = slot;
    }

    /** Set a range of cells to a snapshot slot */
    fillRange(startCell, endCell, slot) {
        const s = Math.max(0, startCell);
        const e = Math.min(endCell, this.totalCells - 1);
        for (let i = s; i <= e; i++) this.cells[i] = slot;
    }

    /** Set a full bar (all 16 subdivisions) */
    setBar(barIndex, slot) {
        const start = barIndex * SUBDIV_PER_BAR;
        this.fillRange(start, start + SUBDIV_PER_BAR - 1, slot);
    }

    /** Get the slot at a bar (returns the slot of the first subdivision) */
    getBar(barIndex) {
        return this.getCell(barIndex * SUBDIV_PER_BAR);
    }

    setLength(len) {
        this.length = Math.max(8, Math.min(MAX_BARS, len));
    }

    // ========================================================================
    // REGION HELPERS
    // ========================================================================

    /** Get all contiguous regions: [{ start, end, slot }] in cell coords */
    getRegions() {
        const regions = [];
        let i = 0;
        const total = this.totalCells;
        while (i < total) {
            const slot = this.cells[i];
            if (slot < 0) { i++; continue; }
            let j = i + 1;
            while (j < total && this.cells[j] === slot) j++;
            regions.push({ start: i, end: j - 1, slot });
            i = j;
        }
        return regions;
    }

    /** Find the region containing a cell index, or null */
    getRegionAt(cellIndex) {
        const slot = this.cells[cellIndex];
        if (slot < 0) return null;
        let start = cellIndex;
        while (start > 0 && this.cells[start - 1] === slot) start--;
        let end = cellIndex;
        while (end < this.totalCells - 1 && this.cells[end + 1] === slot) end++;
        return { start, end, slot };
    }

    /** Move the start edge of a region (junction drag: neighbor end follows). */
    moveRegionStart(region, newStart) {
        newStart = Math.max(0, Math.min(region.end, newStart));
        const oldStart = region.start;
        if (newStart === oldStart) return;

        // Check if there's a neighbor region directly before this one
        const neighborSlot = oldStart > 0 ? this.cells[oldStart - 1] : -1;

        if (newStart > oldStart) {
            // Shrinking this region (moving start right) → expand neighbor or clear
            if (neighborSlot >= 0) {
                for (let i = oldStart; i < newStart; i++) this.cells[i] = neighborSlot;
            } else {
                for (let i = oldStart; i < newStart; i++) this.cells[i] = -1;
            }
        } else {
            // Expanding this region (moving start left) → shrink neighbor or overwrite empty
            for (let i = newStart; i < oldStart; i++) this.cells[i] = region.slot;
        }
    }

    /** Move the end edge of a region (junction drag: neighbor start follows). */
    moveRegionEnd(region, newEnd) {
        newEnd = Math.max(region.start, Math.min(this.totalCells - 1, newEnd));
        const oldEnd = region.end;
        if (newEnd === oldEnd) return;

        // Check if there's a neighbor region directly after this one
        const neighborSlot = oldEnd < this.totalCells - 1 ? this.cells[oldEnd + 1] : -1;

        if (newEnd < oldEnd) {
            // Shrinking this region (moving end left) → expand neighbor or clear
            if (neighborSlot >= 0) {
                for (let i = newEnd + 1; i <= oldEnd; i++) this.cells[i] = neighborSlot;
            } else {
                for (let i = newEnd + 1; i <= oldEnd; i++) this.cells[i] = -1;
            }
        } else {
            // Expanding this region (moving end right) → overwrite with this slot
            for (let i = oldEnd + 1; i <= newEnd; i++) this.cells[i] = region.slot;
        }
    }

    getLastFilledCell() {
        for (let i = this.totalCells - 1; i >= 0; i--) {
            if (this.cells[i] >= 0) return i;
        }
        return -1;
    }

    getLastFilledBar() {
        const c = this.getLastFilledCell();
        return c < 0 ? -1 : Math.floor(c / SUBDIV_PER_BAR);
    }

    clearAll() {
        this.cells.fill(-1);
        this.transitions = {};
    }

    clearRange(startCell, endCell) {
        for (let i = Math.max(0, startCell); i <= Math.min(endCell, this.totalCells - 1); i++) {
            this.cells[i] = -1;
        }
    }

    /** Clear a bar range (in bar indices) */
    clearBarRange(startBar, endBar) {
        this.clearRange(startBar * SUBDIV_PER_BAR, (endBar + 1) * SUBDIV_PER_BAR - 1);
    }

    copyBarRange(startBar, endBar) {
        const s = startBar * SUBDIV_PER_BAR;
        const e = (endBar + 1) * SUBDIV_PER_BAR;
        return Array.from(this.cells.slice(s, e));
    }

    pasteAtBar(barIndex, data) {
        const start = barIndex * SUBDIV_PER_BAR;
        for (let i = 0; i < data.length; i++) {
            if (start + i >= this.totalCells) break;
            this.cells[start + i] = data[i];
        }
    }

    duplicateBarRange(startBar, endBar) {
        const data = this.copyBarRange(startBar, endBar);
        this.pasteAtBar(endBar + 1, data);
        return endBar + 1; // Return the start bar of the duplicated range
    }

    /** Move a bar range by delta bars (positive = right). Returns new start bar. */
    moveBarRange(startBar, endBar, deltaBars) {
        if (deltaBars === 0) return startBar;
        const data = this.copyBarRange(startBar, endBar);
        this.clearBarRange(startBar, endBar);
        const newStart = Math.max(0, Math.min(this.length - (endBar - startBar + 1), startBar + deltaBars));
        this.pasteAtBar(newStart, data);
        return newStart;
    }

    // ========================================================================
    // TRANSITIONS
    // ========================================================================

    /** Find transition points (where slot changes between adjacent occupied cells) */
    getTransitionPoints() {
        const points = [];
        for (let i = 1; i < this.totalCells; i++) {
            const prev = this.cells[i - 1];
            const curr = this.cells[i];
            if (prev >= 0 && curr >= 0 && prev !== curr) {
                points.push({ cell: i, fromSlot: prev, toSlot: curr });
            }
        }
        return points;
    }

    getTransition(cellIndex) { return this.transitions[cellIndex] || null; }

    setTransition(cellIndex, durationSteps, curve) {
        this.transitions[cellIndex] = {
            durationSteps: Math.max(0, Math.min(256, durationSteps)),
            curve: curve || 'linear'
        };
    }

    removeTransition(cellIndex) { delete this.transitions[cellIndex]; }

    cycleTransitionDuration(cellIndex, numSteps) {
        const current = this.transitions[cellIndex];
        const currentDur = current ? current.durationSteps : 0;
        const curve = current ? current.curve : 'linear';
        const presets = [0, 1, 4, numSteps, numSteps * 2, numSteps * 4];
        let nextIdx = 0;
        for (let i = 0; i < presets.length; i++) {
            if (currentDur <= presets[i]) { nextIdx = (i + 1) % presets.length; break; }
        }
        if (presets[nextIdx] === 0) this.removeTransition(cellIndex);
        else this.setTransition(cellIndex, presets[nextIdx], curve);
        return presets[nextIdx];
    }

    cycleCurve(cellIndex) {
        const current = this.transitions[cellIndex];
        if (!current) return 'linear';
        const curves = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];
        const idx = curves.indexOf(current.curve);
        current.curve = curves[(idx + 1) % curves.length];
        return current.curve;
    }

    // ========================================================================
    // PLAYBACK (advances per subdivision, notified per sequencer step)
    // ========================================================================

    startPlayback() {
        if (this.getLastFilledCell() < 0) return;
        this.isPlaying = true;
        this.currentCell = 0;
        this.lastRecalledSlot = -1;
        if (this._morphEngine) this._morphEngine.stop();
        this._processCell(0);
    }

    stopPlayback() {
        this.isPlaying = false;
        this.currentCell = 0;
        this.lastRecalledSlot = -1;
        if (this._morphEngine) this._morphEngine.stop();
    }

    /**
     * Called every 2 sequencer steps (= 1/16 note = 1 cell).
     * The scheduler fires onBarBoundary at step 0; we also need per-step calls.
     * So we call this from the scheduler on EVERY step 0,2,4,...30 (even steps).
     */
    onSubdivision() {
        if (!this.isPlaying) return;
        this.currentCell++;
        const lastFilled = this.getLastFilledCell();
        if (this.currentCell > lastFilled) {
            this.isPlaying = false;
            if (this._morphEngine) this._morphEngine.stop();
            if (this._onSongStop) this._onSongStop();
            return;
        }
        this._processCell(this.currentCell);
    }

    _processCell(cellIndex) {
        const slot = this.cells[cellIndex];
        if (slot >= 0 && slot !== this.lastRecalledSlot) {
            const prevSlot = this.lastRecalledSlot;
            const transition = this.transitions[cellIndex];

            if (transition && transition.durationSteps > 0 &&
                prevSlot >= 0 && this._morphEngine && this._snapshotBank) {
                const fromSnap = this._snapshotBank.slots[prevSlot];
                const toSnap = this._snapshotBank.slots[slot];
                if (fromSnap && toSnap) {
                    const bpm = this._scheduler ? this._scheduler.getBPM() : 120;
                    this._morphEngine.start(fromSnap, toSnap, transition.durationSteps, transition.curve, bpm, 32);
                    this._applyDiscreteState(toSnap);
                    this.lastRecalledSlot = slot;
                } else {
                    this._instantRecall(slot);
                }
            } else {
                this._instantRecall(slot);
            }
        }
        if (this._onBarChange) this._onBarChange(cellIndex, slot);
    }

    _instantRecall(slot) {
        if (this._morphEngine) this._morphEngine.stop();
        if (this._snapshotBank && this._snapshotBank.isOccupied(slot)) {
            this._snapshotBank.recall(slot);
            this.lastRecalledSlot = slot;
        }
    }

    _applyDiscreteState(snap) {
        const tracks = this._snapshotBank?._tracks;
        if (!tracks || !snap.tracks) return;
        const len = Math.min(snap.tracks.length, tracks.length);
        for (let i = 0; i < len; i++) {
            const sd = snap.tracks[i];
            const t = tracks[i];
            t.steps = new Uint8Array(sd.steps);
            t.muted = !!sd.muted;
            t.soloed = !!sd.soloed;
            t.stepLock = !!sd.stepLock;
            t.type = sd.type || 'granular';
            t.clockDivider = sd.clockDivider || 1;
            t.resetOnBar = !!sd.resetOnBar;
            t.resetOnTrig = !!sd.resetOnTrig;
            t.cleanMode = !!sd.cleanMode;
            t.scanSync = !!sd.scanSync;
            t.scanSyncMultiplier = sd.scanSyncMultiplier || 1;
            if (sd.lfos) {
                for (let l = 0; l < Math.min(sd.lfos.length, t.lfos.length); l++) {
                    const lData = sd.lfos[l];
                    const lfo = t.lfos[l];
                    if (lData.wave !== undefined) lfo.wave = lData.wave;
                    if (lData.targets) lfo.targets = [...lData.targets];
                    if (lData.sync !== undefined) lfo.sync = lData.sync;
                    if (lData.syncRateIndex !== undefined) lfo.syncRateIndex = lData.syncRateIndex;
                }
            }
            t.stepPitches = sd.stepPitches ? [...sd.stepPitches] : t.stepPitches;
        }
    }

    // ========================================================================
    // TIME / DISPLAY
    // ========================================================================

    static barDuration(bpm, numSteps) { return (numSteps / 4) * (60 / bpm); }

    static barTimeString(barIndex, bpm, numSteps) {
        const totalSec = barIndex * SongSequencer.barDuration(bpm, numSteps);
        const m = Math.floor(totalSec / 60);
        const s = Math.floor(totalSec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    static formatDuration(durationSteps, numSteps) {
        if (durationSteps === 0) return 'Instant';
        if (durationSteps < numSteps) return `${durationSteps} stp`;
        const bars = Math.floor(durationSteps / numSteps);
        const rem = durationSteps % numSteps;
        if (rem === 0) return `${bars} bar${bars > 1 ? 's' : ''}`;
        return `${bars}b+${rem}s`;
    }

    static curveLabel(curve) {
        switch (curve) {
            case 'ease-in': return 'eIn';
            case 'ease-out': return 'eOut';
            case 'ease-in-out': return 'S';
            default: return 'Lin';
        }
    }

    // ========================================================================
    // SERIALIZE / DESERIALIZE
    // ========================================================================

    serialize() {
        // Compress: store regions instead of all cells
        const regions = this.getRegions();
        const transArr = [];
        for (const [cell, t] of Object.entries(this.transitions)) {
            transArr.push({ cell: parseInt(cell), durationSteps: t.durationSteps, curve: t.curve });
        }
        return { version: 2, length: this.length, regions, transitions: transArr };
    }

    deserialize(obj) {
        if (!obj) return;
        this.length = obj.length || 64;
        this.cells.fill(-1);
        this.transitions = {};

        if (obj.version === 2 && Array.isArray(obj.regions)) {
            // v2: region-based
            for (const r of obj.regions) {
                for (let i = r.start; i <= r.end; i++) {
                    if (i < MAX_CELLS) this.cells[i] = r.slot;
                }
            }
            if (Array.isArray(obj.transitions)) {
                for (const t of obj.transitions) {
                    this.transitions[t.cell] = { durationSteps: t.durationSteps, curve: t.curve || 'linear' };
                }
            }
        } else if (Array.isArray(obj.bars)) {
            // v1 backward compat: bar-based
            for (const entry of obj.bars) {
                if (entry.bar >= 0 && entry.bar < MAX_BARS) {
                    this.setBar(entry.bar, entry.snapshotSlot);
                }
            }
            if (Array.isArray(obj.transitions)) {
                for (const t of obj.transitions) {
                    // Convert bar-based transition to cell-based
                    const cellIdx = (t.bar || 0) * SUBDIV_PER_BAR;
                    this.transitions[cellIdx] = { durationSteps: t.durationSteps, curve: t.curve || 'linear' };
                }
            }
        }
    }
}
