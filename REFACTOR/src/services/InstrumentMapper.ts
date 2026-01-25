import { INSTRUMENT_HEURISTICS } from '../config/mappings';
import { TrackState } from '../types/state';

export class InstrumentMapper {
    static map(instrumentName: string): Partial<TrackState> {
        const nameLower = instrumentName.toLowerCase();
        
        // Find first matching heuristic
        const match = INSTRUMENT_HEURISTICS.find(h => h.check(nameLower));
        
        if (match) {
            const config = match.config;
            
            // Special case logic for hats (open vs closed)
            let finalType = config.params.drumType;
            if (match.config.engine === 'simple-drum' && /hat|shaker/.test(nameLower)) {
                finalType = nameLower.includes('open') ? 'open-hat' : 'closed-hat';
            }

            return {
                type: config.engine,
                params: {
                    ...config.params,
                    drumType: finalType
                } as any
            };
        }
        
        return {};
    }
}