// Preset Manager Module
import { NUM_LFOS } from '../utils/constants.js';

export class PresetManager {
    // Helper: Convert ArrayBuffer to Base64
    bufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Helper: Convert AudioBuffer to WAV ArrayBuffer
    // Simple WAV encoder implementation
    audioBufferToWav(buffer, opt) {
        opt = opt || {};
        var numChannels = buffer.numberOfChannels;
        var sampleRate = buffer.sampleRate;
        var format = opt.float32 ? 3 : 1;
        var bitDepth = format === 3 ? 32 : 16;

        var result;
        if (numChannels === 2) {
            result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }

        return this.encodeWAV(result, numChannels, sampleRate, format, bitDepth);
    }

    interleave(inputL, inputR) {
        var length = inputL.length + inputR.length;
        var result = new Float32Array(length);

        var index = 0;
        var inputIndex = 0;

        while (index < length) {
            result[index++] = inputL[inputIndex];
            result[index++] = inputR[inputIndex];
            inputIndex++;
        }
        return result;
    }

    encodeWAV(samples, numChannels, sampleRate, format, bitDepth) {
        var bytesPerSample = bitDepth / 8;
        var blockAlign = numChannels * bytesPerSample;

        var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        var view = new DataView(buffer);

        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * bytesPerSample, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, samples.length * bytesPerSample, true);

        if (format === 1) { // PCM
            this.floatTo16BitPCM(view, 44, samples);
        } else {
            this.writeFloat32(view, 44, samples);
        }

        return buffer;
    }

    writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    floatTo16BitPCM(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    writeFloat32(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 4) {
            output.setFloat32(offset, input[i], true);
        }
    }

    async savePreset(tracks, bpm) {
        const tracksData = await Promise.all(tracks.map(async t => {
            const trackObj = {
                id: t.id, 
                params: t.params, 
                steps: t.steps, 
                muted: t.muted, 
                soloed: t.soloed, 
                stepLock: t.stepLock,
                lfos: t.lfos.map(l => ({ wave: l.wave, rate: l.rate, amount: l.amount, target: l.target })),
                hasCustomSample: false
            };

            // If track has a custom sample, serialize it
            if (t.customSample && t.buffer) {
                try {
                    // Convert AudioBuffer to WAV
                    const wavBuffer = this.audioBufferToWav(t.buffer);
                    // Convert WAV ArrayBuffer to Base64 string
                    const base64Audio = this.bufferToBase64(wavBuffer);
                    
                    trackObj.hasCustomSample = true;
                    trackObj.customSampleData = {
                        name: t.customSample.name,
                        data: base64Audio,
                        mimeType: 'audio/wav' // We converted to WAV
                    };
                } catch (e) {
                    console.error(`Failed to serialize sample for track ${t.id}:`, e);
                }
            }
            return trackObj;
        }));

        const data = {
            bpm: bpm,
            version: "1.1",
            tracks: tracksData
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url;
        a.download = `grain_preset_full_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    }

    loadPreset(file, tracks, addTrackCallback, updateTrackStateUICallback, matrixStepElements, selectTrackCallback, selectedTrackIndex, audioEngine) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(!data.tracks || !Array.isArray(data.tracks)) throw new Error("Invalid preset");
                const bpm = data.bpm || 120;
                
                // Ensure we have enough tracks
                while(tracks.length < data.tracks.length) addTrackCallback();
                
                const audioCtx = audioEngine.getContext();

                // Process tracks sequentially or via Promise.all if independent
                for (let i = 0; i < data.tracks.length; i++) {
                    const trackData = data.tracks[i];
                    if (i >= tracks.length) break;
                    
                    const t = tracks[i];
                    t.params = { ...t.params, ...trackData.params };
                    t.steps = [...trackData.steps];
                    t.muted = !!trackData.muted; t.soloed = !!trackData.soloed;
                    t.stepLock = !!trackData.stepLock;
                    
                    if (trackData.lfos) trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave; t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount; t.lfos[lIdx].target = lData.target;
                        }
                    });

                    // Handle Custom Sample Loading
                    if (trackData.hasCustomSample && trackData.customSampleData && audioCtx) {
                        try {
                            const sampleInfo = trackData.customSampleData;
                            // Decode Base64 back to ArrayBuffer
                            const binaryString = window.atob(sampleInfo.data);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let j = 0; j < len; j++) {
                                bytes[j] = binaryString.charCodeAt(j);
                            }
                            
                            // Decode Audio Data
                            const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
                            
                            // Apply to track
                            t.customSample = {
                                name: sampleInfo.name,
                                buffer: audioBuffer,
                                duration: audioBuffer.duration
                            };
                            t.buffer = audioBuffer;
                            t.needsSampleReload = false; // It's loaded now
                            
                        } catch (err) {
                            console.error(`Failed to load custom sample for track ${i}:`, err);
                            alert(`Warning: Could not load sample for Track ${i+1}. It may be corrupted or too large.`);
                        }
                    }

                    updateTrackStateUICallback(i);
                    // Refresh grid
                    for(let s=0; s<t.steps.length; s++) {
                         const btn = matrixStepElements[i][s];
                         if(t.steps[s]) btn.classList.add('active'); else btn.classList.remove('active');
                    }
                }
                
                selectTrackCallback(selectedTrackIndex);
                
                // Return BPM to caller (needs async handling usually, but here we might trigger callback or event)
                // We use a custom property on audioEngine to notify main.js
                if (audioEngine.onBpmChange) audioEngine.onBpmChange(bpm);

            } catch (err) { 
                console.error(err); 
                alert("Failed to load preset. " + err.message); 
            }
        };
        reader.readAsText(file);
    }
}