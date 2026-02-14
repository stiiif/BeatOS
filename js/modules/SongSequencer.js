// js/modules/SongSequencer.js
// Song Mode data model and playback engine.
// Each "bar" in the song = one full loop of the BeatOS step sequencer (NUM_STEPS steps).

export class SongSequencer {
    constructor() {
        this.length = 64;          // Song length in bars (8–256)
        this.bars = new Array(256).fill(-1); // -1 = empty, 0–15 = snapshot slot index
        this.transitions = [];     // [{ fromBar, toBar, durationSteps, curve }] — Phase 3

        // Playback state
        this.isPlaying = false;
        this.currentBar = 0;
        this.lastRecalledSlot = -1;

        // External refs
        this._snapshotBank = null;
        this._scheduler = null;
        this._onBarChange = null;  // callback(barIndex, snapshotSlot)
        this._onSongStop = null;   // callback()
    }

    setContext({ snapshotBank, scheduler }) {
        this._snapshotBank = snapshotBank;
        this._scheduler = scheduler;
    }

    setCallbacks({ onBarChange, onSongStop }) {
        this._onBarChange = onBarChange;
        this._onSongStop = onSongStop;
    }

    // ========================================================================
    // DATA MODEL
    // ========================================================================

    setBar(barIndex, snapshotSlot) {
        if (barIndex < 0 || barIndex >= this.length) return;
        this.bars[barIndex] = snapshotSlot; // -1 to clear, 0-15 for snapshot
    }

    getBar(barIndex) {
        if (barIndex < 0 || barIndex >= this.length) return -1;
        return this.bars[barIndex];
    }

    setLength(len) {
        this.length = Math.max(8, Math.min(256, len));
    }

    /** Find the last bar that has a snapshot assigned */
    getLastFilledBar() {
        for (let i = this.length - 1; i >= 0; i--) {
            if (this.bars[i] >= 0) return i;
        }
        return -1;
    }

    clearAll() {
        this.bars.fill(-1);
        this.transitions = [];
    }

    clearRange(start, end) {
        for (let i = start; i <= Math.min(end, this.length - 1); i++) {
            this.bars[i] = -1;
        }
    }

    /** Copy a range of bars. Returns array of snapshot slot values. */
    copyRange(start, end) {
        const out = [];
        for (let i = start; i <= Math.min(end, this.length - 1); i++) {
            out.push(this.bars[i]);
        }
        return out;
    }

    /** Paste array of snapshot slot values starting at barIndex. */
    pasteAt(barIndex, data) {
        for (let i = 0; i < data.length; i++) {
            const target = barIndex + i;
            if (target >= this.length) break;
            this.bars[target] = data[i];
        }
    }

    /** Duplicate range: copy start..end and paste immediately after end. */
    duplicateRange(start, end) {
        const data = this.copyRange(start, end);
        this.pasteAt(end + 1, data);
    }

    // ========================================================================
    // PLAYBACK
    // ========================================================================

    startPlayback() {
        if (this.getLastFilledBar() < 0) return; // Nothing to play
        this.isPlaying = true;
        this.currentBar = 0;
        this.lastRecalledSlot = -1;
        // Trigger first bar immediately
        this._processBar(0);
    }

    stopPlayback() {
        this.isPlaying = false;
        this.currentBar = 0;
        this.lastRecalledSlot = -1;
    }

    /**
     * Called by the main scheduler when step 0 is reached (bar boundary).
     * Advances the song sequencer by one bar.
     */
    onBarBoundary() {
        if (!this.isPlaying) return;
        this.currentBar++;

        // Check if we've passed the last filled bar → stop
        const lastFilled = this.getLastFilledBar();
        if (this.currentBar > lastFilled) {
            this.isPlaying = false;
            if (this._onSongStop) this._onSongStop();
            return;
        }

        this._processBar(this.currentBar);
    }

    _processBar(barIndex) {
        const slot = this.bars[barIndex];
        if (slot >= 0 && slot !== this.lastRecalledSlot) {
            // Snapshot changed — recall it
            if (this._snapshotBank && this._snapshotBank.isOccupied(slot)) {
                this._snapshotBank.recall(slot);
                this.lastRecalledSlot = slot;
            }
        }
        if (this._onBarChange) this._onBarChange(barIndex, slot);
    }

    // ========================================================================
    // TIME CALCULATION
    // ========================================================================

    /** Duration of one bar in seconds at the given BPM and step count */
    static barDuration(bpm, numSteps) {
        return (numSteps / 4) * (60 / bpm);
    }

    /** Time offset of a bar from the start in mm:ss format */
    static barTimeString(barIndex, bpm, numSteps) {
        const totalSec = barIndex * SongSequencer.barDuration(bpm, numSteps);
        const m = Math.floor(totalSec / 60);
        const s = Math.floor(totalSec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ========================================================================
    // SERIALIZE / DESERIALIZE
    // ========================================================================

    serialize() {
        const filledBars = [];
        for (let i = 0; i < this.length; i++) {
            if (this.bars[i] >= 0) {
                filledBars.push({ bar: i, snapshotSlot: this.bars[i] });
            }
        }
        return {
            length: this.length,
            bars: filledBars,
            transitions: this.transitions.map(t => ({ ...t }))
        };
    }

    deserialize(obj) {
        if (!obj) return;
        this.length = obj.length || 64;
        this.bars.fill(-1);
        if (Array.isArray(obj.bars)) {
            for (const entry of obj.bars) {
                if (entry.bar >= 0 && entry.bar < 256) {
                    this.bars[entry.bar] = entry.snapshotSlot;
                }
            }
        }
        this.transitions = Array.isArray(obj.transitions) ? obj.transitions.map(t => ({ ...t })) : [];
    }
}
