import { store } from './state/Store';
import { audioContext } from './core/AudioContext';
import { audioEngine } from './core/AudioEngine'; // Initialize engine
import { scheduler } from './core/time/Scheduler'; // Initialize scheduler

// Components
import { Transport } from './ui/Transport';
import { Grid } from './ui/Grid';
import { Inspector } from './ui/Inspector';
import { Visualizer } from './ui/Visualizer';
import { Layout } from './ui/Layout';
import { LibraryModal } from './ui/modals/LibraryModal';
import { SearchModal } from './ui/modals/SearchModal';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('[BeatOS] Booting...');

    // 1. Instantiate UI Components
    // These automatically subscribe to the store upon creation
    const transport = new Transport();
    const grid = new Grid();
    const inspector = new Inspector();
    const visualizer = new Visualizer();
    const layout = new Layout();
    const libraryModal = new LibraryModal();
    const searchModal = new SearchModal();

    // 2. Handle Audio Context Unlock (Browser Policy)
    const initBtn = document.getElementById('initAudioBtn');
    const overlay = document.getElementById('startOverlay');

    initBtn?.addEventListener('click', async () => {
        initBtn.innerText = 'Initializing...';
        
        try {
            await audioContext.resume();
            console.log('[BeatOS] Audio Context Resumed');
            
            // Generate default buffers for initial tracks
            // In the original, this happened on init. 
            // In our reactive engine, tracks are already in state, so we trigger a refresh logic?
            // Actually, AudioEngine constructor already initializes tracks from default state.
            // But context was suspended. Now it's running.
            
            overlay?.classList.add('hidden');
        } catch (e) {
            console.error('Audio initialization failed', e);
            initBtn.innerText = 'Error - Try Again';
        }
    });

    // 3. Prevent Drag/Drop defaults globally
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());

    console.log('[BeatOS] Ready');
});