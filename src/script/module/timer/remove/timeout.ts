import { timeoutTimers } from '../internal/timeout_timers';
import { Timeout } from '../type';

export function removeTimeout(timerID: Timeout) {
    if (timeoutTimers.delete(timerID)) {
        clearTimeout(timerID);
        if (ENABLE_DEBUG) {
            console.log(`Timeout removed. Total timeouts: ${timeoutTimers.size}.`, timerID);
        }
    } else if (ENABLE_DEBUG) {
        console.error('Timeout not found.', timerID);
    }
}
