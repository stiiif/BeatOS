export class TrackDetailsPanel {
    constructor(uiManager) {
        // Target the container where controls should live.
        // In index.html, this is inside .right-pane -> .flex-1.
        // We will insert a specific container div in index.html to target.
        this.containerId = 'trackSpecificContainer';
        this.uiManager = uiManager;
        this.tracks = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const trackIdx = this.uiManager.getSelectedTrackIndex();
        const track = this.tracks[trackIdx];
        if (!track) return;

        container.innerHTML = ''; // Clear previous controls

        if (track.type === 'granular') {
            container.appendChild(this.createGranularControls());
        } else if (track.type === 'simple-drum') {
            container.appendChild(this.createDrumControls());
        } else if (track.type === 'automation') {
            container.appendChild(this.createAutomationControls());
        }
        
        // We need to re-initialize values of sliders since they are fresh DOM elements
        // This effectively replaces 'updateKnobs' for the structural part, 
        // but TrackControls.updateKnobs() still handles value updates.
        // We should call updateKnobs() immediately after render in the caller.
    }

    createGranularControls() {
        const div = document.createElement('div');
        div.id = 'granularControls';
        div.innerHTML = `
            <div>
                <div class="flex justify-between items-end mb-1">
                    <label class="text-[10px] text-neutral-500 uppercase font-bold">Scope</label>
                    <div class="flex items-center gap-1 bg-neutral-800 rounded p-0.5">
                        <button id="scopeBtnWave" class="px-2 py-0.5 text-[9px] bg-neutral-600 text-white rounded-sm transition">Wave</button>
                        <button id="scopeBtnSpec" class="px-2 py-0.5 text-[9px] text-neutral-400 hover:text-white transition">Spec</button>
                    </div>
                </div>
                <canvas id="bufferDisplay" class="w-full h-[40px] bg-[#111] border border-[#333] rounded mb-[15px]"></canvas>
            </div>

            <div class="space-y-4">
                <div class="flex items-left justify-between">
                    <div class="flex gap-1">
                        <button id="resetParamBtn" class="text-[9px] bg-yellow-800 hover:bg-yellow-700 text-yellow-300 px-2 py-1 rounded transition border border-yellow-700"><i class="fas fa-undo"></i></button>
                        <button id="randomizeBtn" class="text-[9px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded transition border border-neutral-700">Rnd Prms</button>
                        <button id="randModsBtn" class="text-[9px] bg-purple-900/40 hover:bg-purple-800 text-purple-300 px-2 py-1 rounded transition border border-purple-900/50">Rnd Mods</button>
                        <button id="scopeBtnTrim" class="text-[9px] bg-red-900/40 hover:bg-red-800 text-red-300 px-2 py-1 rounded transition border border-red-900/50">Trim</button>
                        <button id="cleanModeBtn" class="text-[9px] bg-blue-900/40 hover:bg-blue-800 text-blue-300 px-2 py-1 rounded transition border border-blue-900/50" title="Hard AGC: Prevent all distortion">Clean</button>
                    </div>
                </div>

                <div class="param-grid">
                    <div class="section-header">CORE</div>
                    <label>Position</label><input type="range" min="0" max="1" step="0.001" data-param="position" class="param-slider"><div class="value-display">0.000</div>
                    <label>Spray</label><input type="range" min="0" max="0.5" step="0.01" data-param="spray" class="param-slider"><div class="value-display">0.00</div>
                    <label>Start</label><input type="range" min="0" max="1" step="0.001" data-param="sampleStart" class="param-slider"><div class="value-display">0.000</div>
                    <label>End</label><input type="range" min="0" max="1" step="0.001" data-param="sampleEnd" class="param-slider" value="1"><div class="value-display">1.000</div>

                    <div class="section-header text-red-400 border-red-900/50">CHAOS</div>
                    <label class="text-red-300">Edge Crunch</label><input type="range" min="0" max="1" step="0.01" data-param="edgeCrunch" class="param-slider accent-red-500"><div class="value-display text-red-300">0%</div>
                    <label class="text-red-300">Orbit</label><input type="range" min="0" max="1" step="0.01" data-param="orbit" class="param-slider accent-red-500"><div class="value-display text-red-300">0%</div>

                    <div class="section-header">GRAIN</div>
                    <label>Overlap</label><input type="range" min="0" max="8" step="0.1" data-param="overlap" class="param-slider"><div class="value-display">2.0x</div>
                    <label>Scan Spd</label>
                    <div class="flex items-center gap-1">
                        <input type="range" min="-2" max="2" step="0.01" data-param="scanSpeed" class="param-slider">
                        <div class="flex gap-0.5 ml-1">
                            <button id="resetOnBarBtn" class="w-5 h-5 bg-neutral-800 text-[8px] border border-neutral-700 rounded hover:bg-neutral-700 transition" title="Reset playhead on Step 1">B</button>
                            <button id="resetOnTrigBtn" class="w-5 h-5 bg-neutral-800 text-[8px] border border-neutral-700 rounded hover:bg-neutral-700 transition" title="Reset playhead on every Trig">T</button>
                        </div>
                    </div>
                    <div class="value-display">1.00</div>
                    <label>Size</label><input type="range" min="0.01" max="1.0" step="0.01" data-param="grainSize" class="param-slider"><div class="value-display">0.10s</div>
                    <label>Density</label><input type="range" min="1" max="100" step="1" data-param="density" class="param-slider"><div class="value-display">20hz</div>
                    <label>Pitch</label><input type="range" min="0.05" max="8.0" step="0.01" data-param="pitch" class="param-slider"><div class="value-display">1.00x</div>
                    <label>Rel Dur</label><input type="range" min="0.01" max="5.0" step="0.01" data-param="relGrain" class="param-slider"><div class="value-display">2.00s</div>

                    <div class="section-header">ENV (ADR)</div>
                    <label>Attack</label><input type="range" min="0.001" max="1" step="0.01" data-param="ampAttack" class="param-slider"><div class="value-display">0.01</div>
                    <label>Decay</label><input type="range" min="0.01" max="1" step="0.01" data-param="ampDecay" class="param-slider"><div class="value-display">0.10</div>
                    <label>Release</label><input type="range" min="0.01" max="2" step="0.01" data-param="ampRelease" class="param-slider"><div class="value-display">0.30</div>

                    <div class="section-header">FX (GLOBAL)</div>
                    <label>HPF</label><input type="range" min="20" max="5000" step="10" data-param="hpFilter" class="param-slider"><div class="value-display">20</div>
                    <label>LPF</label><input type="range" min="100" max="10000" step="100" data-param="filter" class="param-slider"><div class="value-display">8000</div>
                    <label>Vol</label><input type="range" min="0" max="1.5" step="0.01" data-param="volume" class="param-slider"><div class="value-display">0.80</div>
                </div>
            </div>
        `;
        return div;
    }

    createDrumControls() {
        const div = document.createElement('div');
        div.id = 'simpleDrumControls';
        div.className = 'space-y-6';
        div.innerHTML = `
            <div class="flex items-center justify-between border-b border-neutral-700 pb-2">
                <h3 class="text-xs font-bold text-orange-400 uppercase"><i class="fas fa-drum mr-2"></i>909 ENGINE</h3>
            </div>
            <div class="bg-neutral-800/50 p-4 rounded border border-neutral-800">
                <div class="grid grid-cols-2 gap-6">
                    <div class="knob-container">
                        <label class="text-[10px] text-neutral-500 mb-2">Tuning</label>
                        <input type="range" min="0" max="1" step="0.01" data-param="drumTune" class="param-slider">
                        <span class="text-[10px] text-orange-400 font-mono mt-1">0.50</span>
                    </div>
                    <div class="knob-container">
                        <label class="text-[10px] text-neutral-500 mb-2">Decay</label>
                        <input type="range" min="0" max="1" step="0.01" data-param="drumDecay" class="param-slider">
                        <span class="text-[10px] text-orange-400 font-mono mt-1">0.50</span>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    createAutomationControls() {
        const div = document.createElement('div');
        div.id = 'automationControls';
        div.className = 'space-y-6';
        div.innerHTML = `
            <div class="flex items-center justify-between border-b border-neutral-700 pb-2">
                <h3 class="text-xs font-bold text-indigo-400 uppercase"><i class="fas fa-robot mr-2"></i>AUTOMATION LANE</h3>
            </div>
            <div class="bg-neutral-800/50 p-4 rounded border border-neutral-800">
                <label class="text-[10px] text-neutral-500 block mb-2 font-bold uppercase">Clock Speed</label>
                <select id="autoSpeedSelect" class="w-full bg-neutral-900 text-neutral-300 text-xs rounded border border-neutral-700 p-2 outline-none">
                    <option value="1">1/1 (Normal)</option>
                    <option value="2">1/2 (Half Speed)</option>
                    <option value="4">1/4 (Quarter Speed)</option>
                    <option value="8">1/8 (Slow)</option>
                </select>
                <p class="text-[9px] text-neutral-500 mt-2">
                    Click steps to cycle intensity (1-5).<br>
                    Triggers randomization on value change.<br>
                    Reverts to original sound on empty steps.
                </p>
            </div>
        `;
        return div;
    }
}