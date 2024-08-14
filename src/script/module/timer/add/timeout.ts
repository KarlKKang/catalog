import { addOffloadCallback } from '../../global/offload';
import { timeoutTimers } from '../internal/timeout_timers';

export function addTimeout(callback: () => void, ms?: number) {
    addOffloadCallback(offload);
    const timerID = setTimeout(() => {
        if (timeoutTimers.delete(timerID)) {
            callback();
        }
    }, ms);
    timeoutTimers.add(timerID);
    return timerID;
}

function offload() {
    for (const timerID of timeoutTimers) {
        clearTimeout(timerID);
    }
    timeoutTimers.clear();
}
