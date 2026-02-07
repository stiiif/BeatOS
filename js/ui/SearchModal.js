import { FreesoundClient } from '../services/FreesoundClient.js';
import { SampleLoader } from '../services/SampleLoader.js';

export class SearchModal {
    constructor(audioEngine) {
        this.client = new FreesoundClient();
        // Use a default free API key for demonstration if one isn't provided.
        // In production, this should be handled securely or require user input.
        this.client.setApiKey("4DbvH6l42zd0JLdxwvSmGiS7UsCz4Qy1QzbvvTVQ"); 
        
        this.loader = new SampleLoader(audioEngine);
        this.activeTrack = null;
        this.modalElement = null;
        this.audioPreview = new Audio();
        
        this.init();
    }

    init() {
        // Create modal DOM structure
        const modal = document.createElement('div');
        modal.id = 'freesoundModal';
        modal.className = 'hidden fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-neutral-900 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-neutral-700">
                <!-- Header -->
                <div class="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-cloud-download-alt text-emerald-500 text-xl"></i>
                        <h2 class="text-lg font-bold text-white">Freesound Search</h2>
                    </div>
                    <button id="closeSearchModal" class="text-neutral-400 hover:text-white transition">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <!-- Search Bar -->
                <div class="p-4 bg-neutral-900 border-b border-neutral-800 flex gap-2">
                    <input type="text" id="fsSearchInput" placeholder="Search for samples (e.g., 'kick drum', 'glitch texture')..." 
                        class="flex-1 bg-neutral-800 text-white border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:border-emerald-500">
                    
                    <select id="fsDurationFilter" class="bg-neutral-800 text-white border border-neutral-700 rounded px-3 py-2 focus:outline-none">
                        <option value="">Any Length</option>
                        <option value="duration:[0 TO 0.5]">Very Short (< 0.5s)</option>
                        <option value="duration:[0 TO 1]" selected>Short (< 1s)</option>
                        <option value="duration:[1 TO 5]">Medium (1-5s)</option>
                        <option value="duration:[5 TO 30]">Long (5s+)</option>
                    </select>

                    <button id="fsSearchBtn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold transition">
                        <i class="fas fa-search"></i>
                    </button>
                </div>

                <!-- Results Area -->
                <div id="fsResultsList" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#0a0a0a]">
                    <div class="text-center text-neutral-500 mt-20">
                        <i class="fas fa-wave-square text-4xl mb-4 opacity-50"></i>
                        <p>Enter a query to find samples</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-3 border-t border-neutral-800 bg-neutral-900 text-xs text-neutral-500 flex justify-between">
                    <span>Powered by Freesound.org API</span>
                    <span id="fsStatus">Ready</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;

        // Bind events
        document.getElementById('closeSearchModal').addEventListener('click', () => this.hide());
        document.getElementById('fsSearchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('fsSearchInput').addEventListener('keydown', (e) => {
            if(e.key === 'Enter') this.performSearch();
        });
    }

    open(track, initialQuery = "") {
        this.activeTrack = track;
        this.modalElement.classList.remove('hidden');
        const input = document.getElementById('fsSearchInput');
        
        if (initialQuery) {
            input.value = initialQuery;
            this.performSearch();
        } else if (track.autoName) {
            input.value = track.autoName; // Use instrument name as default
        }
        
        input.focus();
    }

    hide() {
        this.modalElement.classList.add('hidden');
        this.audioPreview.pause();
        this.activeTrack = null;
    }

    async performSearch() {
        const query = document.getElementById('fsSearchInput').value;
        const durationFilter = document.getElementById('fsDurationFilter').value;
        const list = document.getElementById('fsResultsList');
        const status = document.getElementById('fsStatus');

        if(!query) return;

        list.innerHTML = '<div class="text-center text-neutral-500 mt-10"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2">Searching...</p></div>';
        status.innerText = "Searching...";

        try {
            // Add license filter to ensure safety
            const filters = [durationFilter, 'license:"Creative Commons 0"'].filter(Boolean).join(" ");
            const results = await this.client.textSearch(query, filters);

            list.innerHTML = '';
            status.innerText = `Found ${results.count} sounds`;

            if (results.results.length === 0) {
                list.innerHTML = '<div class="text-center text-neutral-500 mt-10"><p>No results found.</p></div>';
                return;
            }

            results.results.forEach(sound => {
                this.renderSoundItem(sound, list);
            });

        } catch (e) {
            console.error(e);
            list.innerHTML = `<div class="text-center text-red-500 mt-10"><p>Error: ${e.message}</p></div>`;
            status.innerText = "Error";
        }
    }

    renderSoundItem(sound, container) {
        const item = document.createElement('div');
        item.className = 'bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-emerald-500/50 transition flex items-center justify-between group';
        
        const duration = sound.duration.toFixed(2);
        
        item.innerHTML = `
            <div class="flex items-center gap-4 flex-1 min-w-0">
                <button class="play-preview-btn w-8 h-8 rounded-full bg-neutral-700 hover:bg-emerald-600 text-white flex items-center justify-center transition shrink-0" data-preview="${sound.previews['preview-hq-mp3']}">
                    <i class="fas fa-play text-xs"></i>
                </button>
                <div class="min-w-0">
                    <div class="font-bold text-sm text-neutral-200 truncate group-hover:text-emerald-400 transition">${sound.name}</div>
                    <div class="text-xs text-neutral-500 flex gap-2">
                        <span><i class="fas fa-clock mr-1"></i>${duration}s</span>
                        <span><i class="fas fa-user mr-1"></i>${sound.username}</span>
                    </div>
                </div>
            </div>
            <button class="load-sound-btn bg-neutral-700 hover:bg-emerald-600 text-neutral-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition ml-4 shrink-0">
                LOAD
            </button>
        `;

        // Preview Handler
        const playBtn = item.querySelector('.play-preview-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = playBtn.dataset.preview;
            if (this.audioPreview.src === url && !this.audioPreview.paused) {
                this.audioPreview.pause();
                playBtn.innerHTML = '<i class="fas fa-play text-xs"></i>';
            } else {
                // Reset all other icons
                document.querySelectorAll('.play-preview-btn').forEach(b => b.innerHTML = '<i class="fas fa-play text-xs"></i>');
                this.audioPreview.src = url;
                this.audioPreview.play();
                playBtn.innerHTML = '<i class="fas fa-stop text-xs"></i>';
            }
        });

        // Load Handler
        const loadBtn = item.querySelector('.load-sound-btn');
        loadBtn.addEventListener('click', async () => {
            // FIX: Capture track reference and ID immediately before any async work.
            // If the modal is closed while loader is working, this.activeTrack becomes null,
            // but our local variables 'targetTrack' and 'trackId' remain valid.
            if (!this.activeTrack) return;
            const targetTrack = this.activeTrack;
            const trackId = targetTrack.id;
            
            const originalText = loadBtn.innerText;
            loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            loadBtn.disabled = true;

            try {
                // Use the highest quality preview as the source (MP3)
                const url = sound.previews['preview-hq-mp3'];
                await this.loader.loadSampleFromUrl(url, targetTrack);
                
                // Force Engine Type to Granular
                targetTrack.type = 'granular';
                
                // Reset parameters for clean one-shot playback
                targetTrack.params.position = 0;
                targetTrack.params.grainSize = 0.10; 
                targetTrack.params.density = 20;    
                targetTrack.params.spray = 0;
                targetTrack.params.pitch = 1.0;
                targetTrack.params.overlap = 2.0;   
                targetTrack.params.scanSpeed = 0;
                targetTrack.params.ampAttack = 0.01;
                targetTrack.params.ampDecay = 0.01;
                targetTrack.params.ampRelease = 0.01;
                
                // Provide visual feedback
                loadBtn.innerHTML = '<i class="fas fa-check"></i>';
                loadBtn.classList.add('bg-emerald-600', 'text-white');
                
                // Update track name in UI
                targetTrack.customSample.name = sound.name; 
                
                // Close after brief delay
                setTimeout(() => {
                    this.hide(); // Sets this.activeTrack to null
                    // Force refresh of track header/controls using the captured trackId
                    window.dispatchEvent(new CustomEvent('trackSampleLoaded', { detail: { trackId: trackId } }));
                }, 500);

            } catch (err) {
                console.error(err);
                loadBtn.innerHTML = 'ERR';
                alert("Failed to load sample: " + err.message);
                setTimeout(() => {
                    loadBtn.innerText = originalText;
                    loadBtn.disabled = false;
                }, 2000);
            }
        });

        container.appendChild(item);
    }
}