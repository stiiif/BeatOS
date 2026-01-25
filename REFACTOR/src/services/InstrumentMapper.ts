import { INSTRUMENT_HEURISTICS } from '../config/mappings';
import type { TrackState } from '../types/state';

export class InstrumentMapper {
    static map(instrumentName: string): Partial<TrackState> {
        const nameLower = instrumentName.toLowerCase();
        
        const match = INSTRUMENT_HEURISTICS.find(h => h.check(nameLower));
        
        if (match) {
            const config = match.config;
            
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