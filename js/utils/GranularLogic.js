// Shared logic for Granular Synthesis position calculation
// Ensures Visualizer and Audio Engine always agree on where the grain is.

export class GranularLogic {
    /**
     * Calculates the effective playback position in the buffer (0.0 to 1.0)
     * considering all parameters, modulation, window clamping, and scan speed.
     * @param {Object} params - Base parameters (position, sampleStart, sampleEnd, scanSpeed)
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
        // This is the "Anchor" point determined by the Position knob + LFO
        let anchorPos = params.position + (mod.position || 0);

        // 4. Clamp Anchor to Effective Window
        // This ensures the starting point is valid before scanning begins.
        // If window moves away from position, position is dragged along.
        if (anchorPos < actStart) anchorPos = actStart;
        if (anchorPos > actEnd) anchorPos = actEnd;

        // 5. Calculate Scan Speed Offset
        const currentScanSpeed = params.scanSpeed + (mod.scanSpeed || 0);
        const scanOffset = (currentScanSpeed * time);
        
        // 6. Apply Scan Offset with STRICT Window Wrapping
        // Instead of adding offset directly and wrapping 0-1, 
        // we calculate the position relative to the window start, apply offset, 
        // wrap within the window size, and map back.
        
        let absPos = anchorPos;
        const windowSize = actEnd - actStart;

        if (windowSize > 0.0001) {
            // Calculate relative position from start of window (0 to windowSize)
            let relativePos = anchorPos - actStart;
            
            // Add scan offset to relative position
            // We use modulo math to wrap strictly within [0, windowSize]
            let relativePosWithScan = relativePos + scanOffset;
            
            // Perform wrap (handling negative numbers correctly)
            // (a % n + n) % n is the standard idiom for positive modulo
            let wrappedRelativePos = ((relativePosWithScan % windowSize) + windowSize) % windowSize;
            
            // Map back to absolute coordinates
            absPos = actStart + wrappedRelativePos;
        } else {
            // Window is closed/inverted, stick to start
            absPos = actStart;
        }
        
        // 7. Final safety bounds
        absPos = Math.max(0, Math.min(1, absPos));

        return {
            absPos,     // The final playhead position
            actStart,   // The effective start point
            actEnd      // The effective end point
        };
    }
}