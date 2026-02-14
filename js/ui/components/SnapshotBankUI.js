// js/ui/components/SnapshotBankUI.js
// Renders 16 snapshot buttons (2 rows of 8) + [+] save button in the header.

import { SNAPSHOT_SLOTS } from '../../modules/SnapshotBank.js';

export class SnapshotBankUI {
    constructor(snapshotBank) {
        this.bank = snapshotBank;
        this.container = null;
        this.buttons = [];
        this._addBtn = null;
        this._dblClickTimers = new Map();
        this.onSlotSelect = null; // External callback: (slot) => {}
    }

    /**
     * Build the snapshot UI and insert it into the header.
     * @param {HTMLElement} headerEl - The header element to insert into
     * @param {HTMLElement} insertBeforeEl - Insert before this element (e.g. the right-side buttons)
     */
    render(headerEl, insertBeforeEl) {
        // Remove previous if re-rendering
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = document.createElement('div');
        this.container.className = 'flex items-center gap-2';
        this.container.id = 'snapshotBankContainer';

        // Snapshot grid: 2 rows x 8
        const grid = document.createElement('div');
        grid.className = 'grid grid-rows-2 grid-cols-8 gap-px';
        grid.style.cssText = 'line-height:1;';

        this.buttons = [];
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            const btn = document.createElement('button');
            btn.className = 'snap-slot';
            btn.dataset.slot = i;
            btn.textContent = i + 1;
            btn.title = `Snapshot ${i + 1}`;

            btn.addEventListener('click', (e) => this._onSlotClick(i, e));
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._onSlotClear(i);
            });

            grid.appendChild(btn);
            this.buttons.push(btn);
        }

        // [+] button
        this._addBtn = document.createElement('button');
        this._addBtn.className = 'snap-add-btn';
        this._addBtn.innerHTML = '<i class="fas fa-plus" style="font-size:9px"></i>';
        this._addBtn.title = 'Save snapshot to next available slot';
        this._addBtn.addEventListener('click', () => this._onAddClick());

        // Separator
        const sep = document.createElement('div');
        sep.className = 'h-6 w-px bg-neutral-700 mx-1';

        this.container.appendChild(grid);
        this.container.appendChild(this._addBtn);
        this.container.appendChild(sep);

        if (insertBeforeEl) {
            headerEl.insertBefore(this.container, insertBeforeEl);
        } else {
            headerEl.appendChild(this.container);
        }

        this.refreshAll();
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    _onSlotClick(slot, e) {
        // Shift+click on any slot: overwrite with current live state
        if (e && e.shiftKey) {
            this.bank.saveToSlot(slot);
            const btn = this.buttons[slot];
            btn.classList.add('snap-just-saved');
            setTimeout(() => btn.classList.remove('snap-just-saved'), 500);
            this.refreshAll();
            return;
        }

        // Double-click detection (300ms window)
        if (this._dblClickTimers.has(slot)) {
            clearTimeout(this._dblClickTimers.get(slot));
            this._dblClickTimers.delete(slot);
            this._onSlotClear(slot);
            return;
        }

        this._dblClickTimers.set(slot, setTimeout(() => {
            this._dblClickTimers.delete(slot);
            // Single click — recall
            if (this.bank.isOccupied(slot)) {
                this.bank.recall(slot);
                this.refreshAll();
                if (this.onSlotSelect) this.onSlotSelect(slot);
            }
        }, 250));
    }

    _onSlotClear(slot) {
        if (!this.bank.isOccupied(slot)) return;
        const btn = this.buttons[slot];
        // Flash red animation
        btn.classList.add('snap-clearing');
        setTimeout(() => {
            this.bank.clearSlot(slot);
            btn.classList.remove('snap-clearing');
            this.refreshAll();
        }, 200);
    }

    _onAddClick() {
        const slot = this.bank.saveToNextSlot();
        if (slot === -1) {
            // No slot available — flash red
            this._addBtn.classList.add('snap-no-mem');
            this._addBtn.title = 'No slot available';
            setTimeout(() => {
                this._addBtn.classList.remove('snap-no-mem');
                this._addBtn.title = 'Save snapshot to next available slot';
            }, 800);
            return;
        }
        // Flash green on the filled slot
        const btn = this.buttons[slot];
        btn.classList.add('snap-just-saved');
        setTimeout(() => btn.classList.remove('snap-just-saved'), 500);
        this.refreshAll();
    }

    // ========================================================================
    // VISUAL REFRESH
    // ========================================================================

    refreshAll() {
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            this._refreshSlot(i);
        }
        // Update [Snap] button for "Restore Last Live"
        this._updateSnapButton();
    }

    _refreshSlot(i) {
        const btn = this.buttons[i];
        if (!btn) return;

        const occupied = this.bank.isOccupied(i);
        const active = this.bank.activeSlot === i;

        // Reset classes
        btn.className = 'snap-slot';

        if (occupied) {
            btn.classList.add('snap-occupied');
            if (active) btn.classList.add('snap-active');
            btn.title = `S${i + 1} — Click: recall | Shift+Click: overwrite | Dbl-click: clear`;
        } else {
            btn.classList.add('snap-empty');
            btn.title = `S${i + 1} (empty) — Shift+Click: save here`;
        }
    }

    _updateSnapButton() {
        const snapBtn = document.getElementById('snapshotBtn');
        if (!snapBtn) return;

        if (this.bank.hasLastLive()) {
            snapBtn.classList.add('snap-has-live');
            snapBtn.innerText = 'UNDO';
            snapBtn.title = 'Restore last live state (before snapshot recall)';
        } else {
            snapBtn.classList.remove('snap-has-live');
            snapBtn.innerText = 'Snap';
            snapBtn.title = 'Snapshot (no live state to restore)';
        }
    }

    /**
     * Get a snapshot button element (for drag-and-drop in Song Mode Phase 2)
     */
    getSlotButton(index) {
        return this.buttons[index];
    }
}
