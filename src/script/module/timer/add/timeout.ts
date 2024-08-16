import { timeoutTimers } from '../internal/timeout_timers';

export function addTimeout(callback: () => void, ms?: number) {
    const timerID = setTimeout(() => {
        if (timeoutTimers.delete(timerID)) {
            callback();
            if (DEVELOPMENT) {
                console.log(`Timeout triggered. Total timeouts: ${timeoutTimers.size}.`, timerID);
            }
        }
    }, ms);
    timeoutTimers.add(timerID);
    if (DEVELOPMENT) {
        console.log(`Timeout added. Total timeouts: ${timeoutTimers.size}.`, timerID);
    }
    return timerID;
}
