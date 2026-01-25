// Web Worker for timing
// Responds to "START", "STOP", "UPDATE_CONFIG"
// Emits "TICK"

let timerID: number | null = null;
let interval = 25.0; // ms (Lookahead)

self.onmessage = (e) => {
    if (e.data === 'START') {
        if (!timerID) {
            timerID = setInterval(() => {
                postMessage('TICK');
            }, interval) as unknown as number;
        }
    } else if (e.data === 'STOP') {
        if (timerID) {
            clearInterval(timerID);
            timerID = null;
        }
    } else if (e.data.type === 'INTERVAL') {
        interval = e.data.value;
        if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(() => postMessage('TICK'), interval) as unknown as number;
        }
    }
};