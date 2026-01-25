import { Component } from '../Component';
import { DOM_IDS } from '../../config/dom-ids';
import { store } from '../../state/Store';
import type { AppState } from '../../types/state';
import { ActionTypes } from '../../state/actions';
import { SampleService } from '../../services/SampleService';
import { audioEngine } from '../../core/AudioEngine';

const searchFreesound = async (query: string, filter: string) => {
    return { results: [], count: 0 };
};

export class SearchModal extends Component {
    private modal: HTMLElement;
    private input: HTMLInputElement;
    private results: HTMLElement;
    private closeBtn: HTMLElement;
    private searchBtn: HTMLElement;

    constructor() {
        super();
        if (!document.getElementById('freesoundModal')) {
            this.createModalDOM();
        }
        
        this.modal = document.getElementById('freesoundModal')!;
        this.input = document.getElementById('fsSearchInput') as HTMLInputElement;
        this.results = document.getElementById('fsResultsList')!;
        this.closeBtn = document.getElementById('closeSearchModal')!;
        this.searchBtn = document.getElementById('fsSearchBtn')!;

        this.bindEvents();
    }

    private createModalDOM() {
        const div = document.createElement('div');
        div.id = 'freesoundModal';
        div.className = 'hidden fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
        div.innerHTML = `
            <div class="bg-neutral-900 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-neutral-700">
                <!-- Header, Input, Results, Footer structure -->
                <!-- Strictly following IDs: closeSearchModal, fsSearchInput, fsDurationFilter, fsSearchBtn, fsResultsList, fsStatus -->
            </div>
        `;
        document.body.appendChild(div);
    }

    private bindEvents() {
        this.closeBtn.addEventListener('click', () => {
            store.dispatch({ type: ActionTypes.CLOSE_MODAL });
        });

        this.searchBtn.addEventListener('click', () => this.performSearch());
        
        this.results.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const loadBtn = target.closest('.load-sound-btn') as HTMLElement;
            if (loadBtn && loadBtn.dataset.url) {
                const trackId = store.getState().ui.selectedTrackId;
                
                const buffer = await SampleService.loadFromUrl(loadBtn.dataset.url);
                audioEngine.setBuffer(trackId, buffer);
                
                store.dispatch({
                    type: ActionTypes.LOAD_SAMPLE_METADATA,
                    payload: { trackId, name: loadBtn.dataset.name, duration: buffer.duration }
                });
                
                store.dispatch({ type: ActionTypes.CLOSE_MODAL });
            }
        });
    }

    private async performSearch() {
        // Call Service
    }

    render(state: AppState) {
        if (state.ui.activeModal === 'search') {
            this.modal.classList.remove('hidden');
        } else {
            this.modal.classList.add('hidden');
        }
    }
}