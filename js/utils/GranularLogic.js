// Shared logic for Granular Synthesis position calculation
// Ensures Visualizer and Audio Engine always agree on where the grain is.

export class GranularLogic {
    /**
     * Calculates the effective playback position in the buffer (0.0 to 1.0)
     * considering all parameters, modulation, window clamping, and scan speed.
     * * @param {Object} params - Base parameters (position, sampleStart, sampleEnd, scanSpeed)
     * @param {Object} mod - Modulation values (position, sampleStart, sampleEnd, scanSpeed)
     * @param {number} time - Current audio time (for scan speed calculation)
     * @returns {Object} result - { absPos, actStart, actEnd }
     */
    static calculateEffectivePosition(params, mod, time) {
        // 1. Calculate effective start/end with modulation
        let actStart = Math.max(0, Math.min(1, (params.sampleStart || 0) + (mod.sampleStart || 0)));
        let actEnd = Math.max(0, Math.min(1, (params.sampleEnd !== undefined ? params.sampleEnd : 1) + (mod.sampleEnd || 0)));
        
        // 2. Ensure Start <= End
        if (actStart > actEnd) { 
            const temp = actStart; 
            actStart = actEnd; 
            actEnd = temp; 
        }

        // 3. Calculate effective base position (Absolute)
        let absPos = params.position + (mod.position || 0);

        // 4. Clamp Base Position to Effective Window
        // This is the critical "Anchor" logic: 
        // If window moves away from position, position is dragged along.
        if (absPos < actStart) absPos = actStart;
        if (absPos > actEnd) absPos = actEnd;

        // 5. Add Scan Speed Offset
        const currentScanSpeed = params.scanSpeed + (mod.scanSpeed || 0);
        const visualScanOffset = (currentScanSpeed * time);
        
        absPos += visualScanOffset;
        
        // 6. Wrap 0..1 (Global wrapping)
        // Note: This matches the DSP logic which wraps freely. 
        // Ideally, if we want strict windowing, we'd wrap within [actStart, actEnd], 
        // but currently the engine supports global scan.
        while (absPos >= 1.0) absPos -= 1.0;
        while (absPos < 0.0) absPos += 1.0;
        
        // 7. Final safety bounds for array access
        absPos = Math.max(0, Math.min(1, absPos));

        return {
            absPos,     // The final playhead position
            actStart,   // The effective start point (for visualization)
            actEnd      // The effective end point (for visualization)
        };
    }
}