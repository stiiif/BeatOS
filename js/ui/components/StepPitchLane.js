// js/ui/components/StepPitchLane.js
// Renders per-step pitch bars below the sequencer grid.

import { NUM_STEPS } from '../../utils/constants.js';
import { CHORDS, CHORD_NAMES, SCALES, NOTE_NAMES, semitoneToIntervalName } from '../../modules/pitch/PitchLibrary.js';

export class StepPitchLane {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.visible = false;
        this._container = null;
    }

    setTracks(tracks) { this.tracks = tracks; }
    setSelectedTrackIndex(idx) { this.selectedTrackIndex = idx; if (this.visible) this.render(); }

    toggle() {
        this.visible = !this.visible;
        this.render();
    }

    render() {
        if (!this._container) {
            this._container = document.getElementById('stepPitchLane');
        }
        if (!this._container) return;

        if (!this.visible) {
            this._container.innerHTML = '';
            this._container.style.display = 'none';
            return;
        }

        this._container.style.display = 'block';
        this._container.innerHTML = '';

        const track = this.tracks[this.selectedTrackIndex];
        if (!track || track.type !== 'granular') return;

        const p = track.params;
        const steps = track.steps;
        const numSteps = Math.min(steps.length, NUM_STEPS);

        // Header row with chord preset buttons
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; align-items:center; gap:4px; padding:2px 4px; margin-bottom:2px;';
        
        const title = document.createElement('span');
        title.style.cssText = 'font-size:8px; color:#555; text-transform:uppercase; font-weight:bold;';
        title.innerText = 'Step Pitch';
        header.appendChild(title);

        // Quick chord fill buttons
        const quickChords = ['major', 'minor', 'min7', 'dom7', 'sus2'];
        quickChords.forEach(chordId => {
            const btn = document.createElement('div');
            btn.className = 'wave-btn';
            btn.innerText = CHORD_NAMES[chordId] || chordId;
            btn.style.cssText = 'font-size:6px; padding:1px 3px; cursor:pointer;';
            btn.title = `Fill all active steps with ${CHORD_NAMES[chordId]} chord`;
            btn.onclick = () => {
                const tones = CHORDS[chordId];
                for (let s = 0; s < numSteps; s++) {
                    if (steps[s] > 0) {
                        track.stepPitches[s] = [...tones];
                    }
                }
                this.render();
            };
            header.appendChild(btn);
        });

        // Clear all button
        const clearBtn = document.createElement('div');
        clearBtn.className = 'wave-btn';
        clearBtn.innerText = 'CLR';
        clearBtn.style.cssText = 'font-size:6px; padding:1px 3px; cursor:pointer; color:#f44; margin-left:auto;';
        clearBtn.title = 'Clear all step pitches (use track default)';
        clearBtn.onclick = () => {
            track.stepPitches = new Array(NUM_STEPS).fill(null);
            this.render();
        };
        header.appendChild(clearBtn);

        this._container.appendChild(header);

        // Grid of pitch cells
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${numSteps}, 1fr);
            gap: 1px;
            padding: 0 4px;
        `;

        for (let s = 0; s < numSteps; s++) {
            const cell = document.createElement('div');
            const isActive = steps[s] > 0;
            const pitchData = track.stepPitches[s]; // null or [semitone, ...]

            cell.style.cssText = `
                min-height: 28px;
                background: ${isActive ? '#1a1a1a' : '#0d0d0d'};
                border-radius: 2px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                gap: 1px;
                padding: 1px;
                cursor: ${isActive ? 'pointer' : 'default'};
                opacity: ${isActive ? '1' : '0.3'};
                position: relative;
            `;

            if (isActive && pitchData && pitchData.length > 0) {
                // Show pitch bars for each chord tone
                pitchData.forEach((semi, noteIdx) => {
                    const bar = document.createElement('div');
                    const hue = (semi * 30 + 200) % 360;
                    bar.style.cssText = `
                        width: 100%;
                        height: 5px;
                        background: hsl(${hue}, 60%, ${noteIdx === 0 ? '55%' : '35%'});
                        border-radius: 1px;
                        font-size: 6px;
                        color: #fff;
                        text-align: center;
                        line-height: 5px;
                        overflow: hidden;
                    `;
                    bar.title = `${semitoneToIntervalName(semi)} (${semi}st)`;
                    cell.appendChild(bar);
                });
            } else if (isActive) {
                // Show default indicator (no per-step override)
                const dot = document.createElement('div');
                dot.style.cssText = 'width:3px; height:3px; background:#333; border-radius:50%; margin:auto;';
                dot.title = 'Using track chord default';
                cell.appendChild(dot);
            }

            // Click to edit
            if (isActive) {
                cell.onclick = (e) => {
                    e.stopPropagation();
                    this._openEditor(track, s, cell);
                };
            }

            grid.appendChild(cell);
        }

        this._container.appendChild(grid);
    }

    _openEditor(track, stepIndex, anchor) {
        // Remove any existing popup
        const existing = document.getElementById('stepPitchEditor');
        if (existing) existing.remove();

        const p = track.params;
        const currentPitches = track.stepPitches[stepIndex];
        const scaleIntervals = SCALES[p.scaleType || 'chromatic'] || SCALES.chromatic;
        const scaleRoot = p.scaleRoot || 0;

        const popup = document.createElement('div');
        popup.id = 'stepPitchEditor';
        popup.style.cssText = `
            position: fixed;
            z-index: 9999;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 8px;
            min-width: 180px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;

        // Title
        const title = document.createElement('div');
        title.style.cssText = 'font-size:9px; color:#888; margin-bottom:6px; font-weight:bold;';
        title.innerText = `STEP ${stepIndex + 1} PITCH`;
        popup.appendChild(title);

        // Note grid — show scale degrees as toggleable pills
        const noteGrid = document.createElement('div');
        noteGrid.style.cssText = 'display:flex; flex-wrap:wrap; gap:2px; margin-bottom:6px;';

        // Show 2 octaves of scale degrees
        const activePitches = new Set(currentPitches || []);
        for (let oct = 0; oct < 2; oct++) {
            for (const degree of scaleIntervals) {
                const semi = degree + oct * 12;
                if (semi > 24) break;
                const noteName = NOTE_NAMES[(semi + scaleRoot) % 12];
                const isActive = activePitches.has(semi);
                
                const pill = document.createElement('div');
                pill.className = `wave-btn ${isActive ? 'active' : ''}`;
                pill.innerText = `${noteName}${oct > 0 ? '+' : ''}`;
                pill.style.cssText = `font-size:8px; padding:2px 4px; cursor:pointer; min-width:20px; text-align:center;`;
                pill.onclick = () => {
                    if (activePitches.has(semi)) {
                        activePitches.delete(semi);
                    } else {
                        activePitches.add(semi);
                    }
                    track.stepPitches[stepIndex] = activePitches.size > 0 ? [...activePitches].sort((a,b) => a-b) : null;
                    this.render();
                    // Re-open editor at same step
                    setTimeout(() => {
                        const cells = this._container.querySelectorAll('[style*="min-height: 28px"]');
                        if (cells[stepIndex]) this._openEditor(track, stepIndex, cells[stepIndex]);
                    }, 10);
                };
                noteGrid.appendChild(pill);
            }
        }
        popup.appendChild(noteGrid);

        // Chord preset buttons
        const presetRow = document.createElement('div');
        presetRow.style.cssText = 'display:flex; gap:2px; flex-wrap:wrap; margin-bottom:4px;';
        ['major', 'minor', 'min7', 'dom7', 'sus2', 'dim', 'aug'].forEach(chordId => {
            const btn = document.createElement('div');
            btn.className = 'wave-btn';
            btn.innerText = CHORD_NAMES[chordId];
            btn.style.cssText = 'font-size:7px; padding:1px 3px; cursor:pointer;';
            btn.onclick = () => {
                track.stepPitches[stepIndex] = [...CHORDS[chordId]];
                this.render();
                popup.remove();
            };
            presetRow.appendChild(btn);
        });
        popup.appendChild(presetRow);

        // Clear / Close
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex; justify-content:space-between; margin-top:4px;';
        
        const clearBtn = document.createElement('div');
        clearBtn.className = 'wave-btn';
        clearBtn.innerText = 'Default';
        clearBtn.style.cssText = 'font-size:7px; padding:1px 4px; cursor:pointer; color:#888;';
        clearBtn.onclick = () => {
            track.stepPitches[stepIndex] = null;
            this.render();
            popup.remove();
        };
        actions.appendChild(clearBtn);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'wave-btn';
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = 'font-size:8px; padding:1px 4px; cursor:pointer;';
        closeBtn.onclick = () => popup.remove();
        actions.appendChild(closeBtn);

        popup.appendChild(actions);

        // Position near the cell
        document.body.appendChild(popup);
        const rect = anchor.getBoundingClientRect();
        popup.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
        popup.style.top = `${rect.bottom + 4}px`;

        // Close on outside click
        const closer = (e) => {
            if (!popup.contains(e.target) && e.target !== anchor) {
                popup.remove();
                document.removeEventListener('mousedown', closer);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closer), 0);
    }
}
