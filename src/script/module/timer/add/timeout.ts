import { timeoutTimers } from '../internal/timeout_timers';

export function addTimeout(callback: () => void, ms?: number) {
    const timerID = setTimeout(() => {
        if (timeoutTimers.delete(timerID)) {
            callback();
        }
    }, ms);
    timeoutTimers.add(timerID);
    return timerID;
}
