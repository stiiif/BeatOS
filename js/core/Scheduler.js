// Scheduler Module - Phase 4.1: Safety Switch & Legacy Fallback
// Supports toggling between Worklet-driven clock (default) and Main Thread clock (legacy)

import { NUM_STEPS, LOOKAHEAD, SCHEDULE_AHEAD_TIME } from '../utils/constants.js';

export class Scheduler {
    constructor(audioEngine, granularSynth) {
        console.log("[Scheduler] Initializing...");
        this.audioEngine = audioEngine;
        this.granularSynth = granularSynth;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        
        // Safety Switch: Toggle this to false to use the old Main Thread scheduler
        this.USE_WORKLET_CLOCK = true;
        console.log(`[Scheduler] USE_WORKLET_CLOCK is set to: ${this.USE_WORKLET_CLOCK}`);

        // Legacy state
        this.nextNoteTime = 0.0;
        this.schedulerTimerID = null;
        this.totalStepsPlayed = 0;
        
        // Callbacks
        this.updateMatrixHeadCallback = null;
        this.randomChokeCallback = null;
        this.scheduleVisualDrawCallback = null; // Store for legacy mode
        
        this.trackManager = null; 
        this.activeSnapshot = null; 

        // Listen for ticks from the Worklet (only used if USE_WORKLET_CLOCK is true)
        this.initWorkletListener();
    }

    initWorkletListener() {
        console.log("[Scheduler] Attempting to init worklet listener...");
        if (this.granularSynth.workletNode) {
            console.log("[Scheduler] WorkletNode found immediately. Setting up listener.");
            this.setupWorkletListener();
        } else {
            console.log("[Scheduler] WorkletNode not ready. Starting retry interval...");
            // Retry if worklet not ready
            const checkInterval = setInterval(() => {
                if (this.granularSynth.workletNode) {
                    console.log("[Scheduler] WorkletNode is now ready. Setting up listener.");
                    this.setupWorkletListener();
                    clearInterval(checkInterval);
                }
            }, 100);
        }
    }

    setupWorkletListener() {
        // Prevent double binding
        if (this.granularSynth.workletNode._schedulerListenerAttached) {
            console.log("[Scheduler] Listener already attached. Skipping.");
            return;
        }

        console.log("[Scheduler] Attaching 'onmessage' listener to WorkletNode.");
        const existingHandler = this.granularSynth.workletNode.port.onmessage;
        
        this.granularSynth.workletNode.port.onmessage = (e) => {
            // Log every message for debugging
            // console.log("[Scheduler] Message received from Worklet:", e.data);

            if (existingHandler) existingHandler(e);
            
            const { type, step } = e.data;
            if (type === 'tick' && this.USE_WORKLET_CLOCK) {
                // console.log(`[Scheduler] Received tick: ${step}`); // Too noisy for normal logs, uncomment if needed
                this.handleTick(step);
            }
        };
        this.granularSynth.workletNode._schedulerListenerAttached = true;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setBPM(bpm) {
        this.bpm = Math.max(30, Math.min(300, parseInt(bpm)));
        console.log(`[Scheduler] BPM set to ${this.bpm}`);
        if (this.USE_WORKLET_CLOCK) {
            this.syncToWorklet(); 
        }
    }

    getBPM() {
        return this.bpm;
    }

    setUpdateMatrixHeadCallback(callback) {
        this.updateMatrixHeadCallback = callback;
    }

    setRandomChokeCallback(callback) {
        this.randomChokeCallback = callback;
    }

    // Helper to ensure Worklet is connected to audio graph so it processes frames
    ensureWorkletConnections() {
        if (!this.granularSynth || !this.granularSynth.workletNode || !this.trackManager) {
            console.warn("[Scheduler] Cannot ensure connections: missing dependencies.");
            return;
        }
        
        const workletNode = this.granularSynth.workletNode;
        const tracks = this.trackManager.getTracks();
        
        // Initialize connectedTracks set if missing (should have been in GranularSynthWorklet)
        if (!workletNode.connectedTracks) {
            workletNode.connectedTracks = new Set();
        }

        let connectionCount = 0;
        tracks.forEach(track => {
            if (track.bus && track.bus.input && !workletNode.connectedTracks.has(track.id)) {
                try {
                    // Connect worklet output N to track bus input
                    workletNode.connect(track.bus.input, track.id, 0);
                    workletNode.connectedTracks.add(track.id);
                    connectionCount++;
                } catch (e) {
                    console.error(`[Scheduler] Failed to connect Worklet Ch ${track.id} to Bus:`, e);
                }
            }
        });
        
        if (connectionCount > 0) {
            console.log(`[Scheduler] Established ${connectionCount} new audio connections for Worklet.`);
        }
    }

    start(scheduleVisualDrawCallback) {
        console.log("[Scheduler] Start called.");
        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx) {
            console.error("[Scheduler] AudioContext is missing!");
            return;
        }
        
        this.scheduleVisualDrawCallback = scheduleVisualDrawCallback; // Save for legacy

        if (!this.isPlaying) {
            console.log("[Scheduler] Starting playback...");
            this.isPlaying = true;
            this.currentStep = 0;
            this.totalStepsPlayed = 0;
            
            // Ensure listener is attached before starting
            this.initWorkletListener();

            // Snapshot for automation reset on stop
            this.activeSnapshot = null;
            if (this.trackManager) {
                this.trackManager.getTracks().forEach(t => { 
                    if(t.type === 'automation') t.lastAutoValue = 0; 
                });
            }

            if (this.USE_WORKLET_CLOCK) {
                console.log("[Scheduler] Mode: Worklet Clock.");
                
                // CRITICAL FIX: Ensure Worklet outputs are connected so 'process()' runs
                this.ensureWorkletConnections();

                // 1. Upload Grid to Worklet
                this.syncToWorklet();

                // 2. Start Worklet Clock
                if (this.granularSynth && this.granularSynth.workletNode) {
                    console.log("[Scheduler] Posting 'transport:start' to Worklet.");
                    this.granularSynth.workletNode.port.postMessage({
                        type: 'transport',
                        data: { action: 'start' }
                    });
                } else {
                    console.warn("[Scheduler] Worklet node not ready, falling back to legacy scheduler");
                    this.nextNoteTime = audioCtx.currentTime + 0.1;
                    this.scheduleLegacy();
                }
            } else {
                console.log("[Scheduler] Mode: Legacy Clock.");
                // Legacy Mode: Start Main Thread Loop
                this.nextNoteTime = audioCtx.currentTime + 0.1;
                this.scheduleLegacy();
            }
        } else {
            console.log("[Scheduler] Already playing.");
        }
    }

    stop() {
        console.log("[Scheduler] Stop called.");
        this.isPlaying = false;
        
        if (this.USE_WORKLET_CLOCK) {
            // Stop Worklet Clock
            if (this.granularSynth && this.granularSynth.workletNode) {
                console.log("[Scheduler] Posting 'transport:stop' to Worklet.");
                this.granularSynth.workletNode.port.postMessage({
                    type: 'transport',
                    data: { action: 'stop' }
                });
            }
        }
        
        // Always clear legacy timer just in case
        clearTimeout(this.schedulerTimerID);

        // Reset Automation State
        if(this.activeSnapshot && this.trackManager) {
            this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
            this.activeSnapshot = null;
        }
        
        // Stop any lingering Web Audio nodes (simple drums legacy cleanup)
        if (this.trackManager) {
            this.trackManager.getTracks().forEach(t => {
                if(t.stopAllSources) t.stopAllSources();
            });
        }
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    getCurrentStep() {
        return this.currentStep;
    }

    // --- WORKLET MODE HANDLER ---
    handleTick(step) {
        // console.log(`[Scheduler] Handling tick for step ${step}`);
        this.currentStep = step;
        
        // 1. Update UI Head
        if (this.updateMatrixHeadCallback) {
            requestAnimationFrame(() => this.updateMatrixHeadCallback(step, step)); 
        }

        // 2. Handle Automation Logic (Main Thread Side)
        if (this.trackManager) {
            this.trackManager.getTracks().forEach(t => {
                if (t.type === 'automation' && !t.muted) {
                    this.processAutomationTrack(t, step);
                }
            });
        }
    }

    syncToWorklet() {
        console.log("[Scheduler] Syncing data to Worklet...");
        if (!this.trackManager || !this.granularSynth || !this.granularSynth.workletNode) {
            console.warn("[Scheduler] Cannot sync to Worklet: Missing dependencies.");
            return;
        }

        const tracks = this.trackManager.getTracks();
        
        const steps = tracks.map(t => {
            if (t.muted && !t.soloed) return new Uint8Array(NUM_STEPS).fill(0);
            return t.steps; 
        });

        const trackParams = tracks.map(t => ({
            id: t.id,
            type: t.type,
            params: t.params
        }));

        this.granularSynth.workletNode.port.postMessage({
            type: 'syncSequencer',
            data: {
                bpm: this.bpm,
                steps: steps,
                trackParams: trackParams
            }
        });
        console.log("[Scheduler] Sync message posted.");
    }

    // --- LEGACY MODE SCHEDULER (Fallback) ---
    scheduleLegacy() {
        const audioCtx = this.audioEngine.getContext();
        while (this.nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
            this.scheduleStepLegacy(this.currentStep, this.nextNoteTime);
            this.nextNextTimeLegacy();
        }
        this.schedulerTimerID = window.setTimeout(() => this.scheduleLegacy(), LOOKAHEAD);
    }

    nextNextTimeLegacy() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat / 4;
        this.currentStep = (this.currentStep + 1) % NUM_STEPS;
        this.totalStepsPlayed++; 
    }

    scheduleStepLegacy(step, time) {
        const currentTotal = this.totalStepsPlayed;

        if (this.updateMatrixHeadCallback) {
            requestAnimationFrame(() => this.updateMatrixHeadCallback(step, currentTotal));
        }
        
        // Automation
        this.tracks.forEach(t => {
            if (t.type === 'automation' && !t.muted) {
                this.processAutomationTrack(t, currentTotal);
            }
        });

        // Audio Triggering (The old logic)
        const isAnySolo = this.tracks.some(t => t.soloed && t.type !== 'automation');
        for (let i = 0; i < this.tracks.length; i++) {
            const t = this.tracks[i];
            if (t.type === 'automation') continue; 
            if (t.steps[step] === 0) continue;
            
            if (isAnySolo) {
                if (t.soloed) this.triggerTrackLegacy(t, time, step);
            } else {
                if (!t.muted) this.triggerTrackLegacy(t, time, step);
            }
        }
    }

    triggerTrackLegacy(track, time, stepIndex) {
        if (track.chokeGroup > 0) {
            this.tracks.forEach(other => {
                if (other.id !== track.id && other.chokeGroup === track.chokeGroup) {
                    other.stopAllSources(time);
                }
            });
        }

        const velocity = track.steps[stepIndex];
        const microtimingMs = track.microtiming[stepIndex] || 0;
        const offsetSeconds = microtimingMs / 1000.0;
        let actualTime = time + offsetSeconds;
        
        const audioCtx = this.audioEngine.getContext();
        if (audioCtx && actualTime < audioCtx.currentTime) {
            actualTime = audioCtx.currentTime;
        }

        // Use the old scheduleNote method which relies on Main Thread triggering
        // Note: GranularSynthWorklet.scheduleNote has been updated to use message passing,
        // but it still supports individual note triggers via 'noteOn' message.
        // The key diff is that here the Scheduler calls it, whereas in Worklet mode the internal loop does.
        this.granularSynth.scheduleNote(track, actualTime, this.scheduleVisualDrawCallback, velocity);
    }

    // Shared Automation Logic
    processAutomationTrack(track, currentStep) {
        if (!this.trackManager) return;

        const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
        const effectiveStepIndex = Math.floor(currentStep / track.clockDivider) % trackLength;
        const currentValue = track.steps[effectiveStepIndex];
        const prevValue = track.lastAutoValue;

        if (currentValue !== prevValue) {
            if (prevValue === 0 && currentValue > 0) {
                if (!this.activeSnapshot) {
                    this.activeSnapshot = this.trackManager.saveGlobalSnapshot();
                }
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue > 0) {
                this.trackManager.triggerRandomization(currentValue);
            }
            else if (prevValue > 0 && currentValue === 0) {
                if (this.activeSnapshot) {
                    this.trackManager.restoreGlobalSnapshot(this.activeSnapshot);
                    this.activeSnapshot = null;
                }
            }
            track.lastAutoValue = currentValue;
            
            if (this.USE_WORKLET_CLOCK) {
                this.syncToWorklet();
            }
        }
    }
}