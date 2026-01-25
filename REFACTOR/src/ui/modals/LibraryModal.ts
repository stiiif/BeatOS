import { Component } from '../Component';
import { DOM_IDS } from '../../config/dom-ids';
import { store } from '../../state/Store';
import { AppState } from '../../types/state';
import { ActionTypes } from '../../state/actions';
import { LibraryService, SavedTrack } from '../../services/LibraryService';
import { audioEngine } from '../../core/AudioEngine';

export class LibraryModal extends Component {
    private modal: HTMLElement;
    private list: HTMLElement;
    private emptyMsg: HTMLElement;
    private closeBtn: HTMLElement;
    private importBtn: HTMLElement;
    private importInput: HTMLInputElement;

    constructor() {
        super();
        this.modal = document.getElementById(DOM_IDS.LIBRARY.MODAL)!;
        this.list = document.getElementById(DOM_IDS.LIBRARY.LIST)!;
        this.emptyMsg = document.getElementById(DOM_IDS.LIBRARY.EMPTY_MSG)!;
        this.closeBtn = document.getElementById(DOM_IDS.LIBRARY.CLOSE)!;
        this.importBtn = document.getElementById(DOM_IDS.LIBRARY.IMPORT_BTN)!;
        this.importInput = document.getElementById(DOM_IDS.LIBRARY.IMPORT_INPUT) as HTMLInputElement;

        this.bindEvents();
    }

    private bindEvents() {
        this.closeBtn.addEventListener('click', () => {
            store.dispatch({ type: ActionTypes.CLOSE_MODAL });
        });

        this.importBtn.addEventListener('click', () => this.importInput.click());

        this.importInput.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const { track, buffer } = await LibraryService.importTrack(file);
                    const selectedId = store.getState().ui.selectedTrackId;
                    
                    // 1. Update State (Merge loaded params into selected track)
                    // We dispatch a bulk update or set type
                    store.dispatch({
                        type: ActionTypes.SET_TRACK_TYPE,
                        payload: { 
                            trackId: selectedId, 
                            type: track.type || 'granular',
                            defaults: track.params || {}
                        }
                    });
                    
                    // 2. Load Buffer
                    if (buffer) {
                        audioEngine.setBuffer(selectedId, buffer);
                        store.dispatch({
                            type: ActionTypes.LOAD_SAMPLE_METADATA,
                            payload: { 
                                trackId: selectedId, 
                                name: track.sample?.name || 'Imported', 
                                duration: buffer.duration 
                            }
                        });
                    }
                    
                    this.closeModal();
                } catch (err) {
                    alert('Failed to import track');
                }
                this.importInput.value = '';
            }
        });
    }

    private renderList() {
        const tracks = LibraryService.getSavedTracks();
        this.list.innerHTML = '';

        if (tracks.length === 0) {
            this.emptyMsg.classList.remove('hidden');
            return;
        }
        
        this.emptyMsg.classList.add('hidden');

        tracks.forEach((t, index) => {
            const item = document.createElement('div');
            item.className = 'bg-neutral-800 p-3 rounded hover:bg-neutral-750 border border-neutral-700 flex justify-between items-center group cursor-pointer';
            
            item.innerHTML = `
                <div class="flex-1">
                    <div class="font-bold text-sm text-white group-hover:text-emerald-400 transition">${t.name}</div>
                    <div class="text-xs text-neutral-500">${new Date(t.timestamp).toLocaleString()}</div>
                </div>
                <div class="flex gap-2 opacity-50 group-hover:opacity-100 transition">
                    <button class="export-btn text-neutral-400 hover:text-indigo-400 transition px-2"><i class="fas fa-file-export"></i></button>
                    <button class="delete-btn text-neutral-400 hover:text-red-500 transition px-2"><i class="fas fa-trash"></i></button>
                </div>
            `;

            // Click to load
            item.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).closest('button')) return; // Ignore button clicks
                this.loadTrack(t);
            });

            // Delete
            item.querySelector('.delete-btn')!.addEventListener('click', () => {
                if (confirm('Delete saved track?')) {
                    LibraryService.deleteTrack(index);
                    this.renderList(); // Re-render
                }
            });

            // Export
            item.querySelector('.export-btn')!.addEventListener('click', async () => {
                // To export, we need the buffer. 
                // Since LibraryService only stores metadata/params in LS, we can't export WAV 
                // UNLESS the track is currently loaded or we change architecture to store blobs in IndexedDB.
                // For this refactor, we disable export from library if no buffer available, 
                // or we export JSON only.
                // NOTE: The original code allowed exporting current track. Exporting from library was limited.
                alert('Export from library not fully supported in this version. Load track first, then export.');
            });

            this.list.appendChild(item);
        });
    }

    private loadTrack(savedTrack: SavedTrack) {
        const selectedId = store.getState().ui.selectedTrackId;
        
        store.dispatch({
            type: ActionTypes.SET_TRACK_TYPE,
            payload: {
                trackId: selectedId,
                type: savedTrack.type,
                defaults: savedTrack.params
            }
        });
        
        // TODO: Restore Pattern/Steps
        // We need a BULK_UPDATE action for steps.
        // For now, we assume SET_TRACK_TYPE handles params, but steps need iteration.
        // This is a simplified implementation.
        
        this.closeModal();
    }

    private closeModal() {
        store.dispatch({ type: ActionTypes.CLOSE_MODAL });
    }

    render(state: AppState) {
        if (state.ui.activeModal === 'library') {
            this.modal.classList.remove('hidden');
            this.renderList(); // Refresh list on open
        } else {
            this.modal.classList.add('hidden');
        }
    }
}