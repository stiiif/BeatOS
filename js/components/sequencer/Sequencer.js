import { BaseComponent } from '../BaseComponent.js';
import { TrackRow } from './TrackRow.js';
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../config/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../config/events.js';

export class Sequencer extends BaseComponent {
    constructor(containerSelector, trackManager) {
        super(containerSelector);
        this.trackManager = trackManager;
        this.rows = []; // Array of TrackRow instances
        this.selectedTrackIndex = 0;
        
        // Header container (optional, might be separate)
        this.headerContainer = document.getElementById('stepHeaders');
        
        this.renderHeader();
        this.initEventListeners();
    }

    initEventListeners() {
        globalBus.on(EVENTS.TRACK_ADDED, (track) => {
            this.addTrackRow(track);
        });

        globalBus.on(EVENTS.TRACK_SELECTED, (index) => {
            this.handleTrackSelection(index);
        });

        // Group actions from rows
        globalBus.on('GROUP_ACTION', (data) => {
            this.handleGroupAction(data);
        });
        
        // Listen for global groove application to refresh UI
        globalBus.on(EVENTS.GROOVE_APPLIED, () => {
            this.refreshAllRows();
        });
        
        // Listen for general updates (clear, randomize)
        globalBus.on(EVENTS.TRACK_UPDATED, (data) => {
            if (data && data.trackId !== undefined) {
                // Specific row update if needed
                const row = this.rows.find(r => r.track.id === data.trackId);
                if (row) {
                    row.track.steps.forEach((_, i) => row.updateStepVisual(row.stepElements[i], i));
                }
            } else {
                this.refreshAllRows();
            }
        });
    }

    renderHeader() {
        if (!this.headerContainer) return;
        this.headerContainer.innerHTML = '';
        this.headerContainer.className = 'sequencer-grid sticky top-0 bg-neutral-950 z-30 pb-2 border-b border-neutral-800 pt-2';

        const createCell = (text, cls = '') => {
            const d = document.createElement('div');
            d.className = 'header-cell ' + cls;
            d.innerHTML = text;
            return d;
        };

        this.headerContainer.appendChild(createCell('TRK', 'font-bold'));

        for(let i=0; i<NUM_STEPS; i++) {
            const div = createCell(i + 1);
            div.id = `header-step-${i}`;
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) div.classList.add('bar-divider');
            else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) div.classList.add('beat-divider');
            this.headerContainer.appendChild(div);
        }

        this.headerContainer.appendChild(createCell('<i class="fas fa-dice"></i>'));
        this.headerContainer.appendChild(createCell('ACTIONS'));
        this.headerContainer.appendChild(createCell('VIS'));
    }

    addTrackRow(track) {
        const row = new TrackRow(track, track.id, this.trackManager);
        this.rows.push(row);
        row.mount(this.container);
        
        // Ensure new row matches selection state
        if (track.id === this.selectedTrackIndex) {
            row.setSelected(true);
        }
    }

    handleTrackSelection(index) {
        this.selectedTrackIndex = index;
        this.rows.forEach(row => {
            row.setSelected(row.index === index);
        });
    }

    handleGroupAction(data) {
        const start = data.group * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        
        this.rows.forEach(row => {
            if (row.index >= start && row.index < end) {
                if (data.type === 'MUTE') row.toggleMute();
                if (data.type === 'SOLO') row.toggleSolo();
                if (data.type === 'CLEAR') row.clearPattern();
            }
        });
    }

    refreshAllRows() {
        this.rows.forEach(row => {
            row.updateActionVisuals();
            row.updateOpacity();
            row.track.steps.forEach((_, i) => row.updateStepVisual(row.stepElements[i], i));
        });
    }

    // Called by Scheduler loop
    updatePlayhead(step) {
        this.rows.forEach(row => {
            const div = row.track.clockDivider || 1;
            const trackLength = row.track.steps.length;
            const effectiveStep = Math.floor(step / div) % trackLength;

            // Simple DOM manipulation for performance
            // Find currently playing step and remove class
            const currentLit = row.stepElements.find(el => el.classList.contains('step-playing'));
            if (currentLit) currentLit.classList.remove('step-playing');

            // Add class to new step
            if (row.stepElements[effectiveStep]) {
                row.stepElements[effectiveStep].classList.add('step-playing');
            }
        });
    }
}