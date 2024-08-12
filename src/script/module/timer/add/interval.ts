import { addOffloadCallback } from '../../global';
import { intervalTimers } from '../internal/interval_timers';

export function addInterval(callback: () => void, ms?: number) {
    addOffloadCallback(offload);
    const timerID = setInterval(() => {
        if (intervalTimers.has(timerID)) {
            callback();
        }
    }, ms);
    intervalTimers.add(timerID);
    return timerID;
}

function offload() {
    for (const timerID of intervalTimers) {
        clearInterval(timerID);
    }
    intervalTimers.clear();
}