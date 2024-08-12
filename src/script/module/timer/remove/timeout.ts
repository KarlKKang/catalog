import { timeoutTimers } from '../internal/timeout_timers';
import { Timeout } from '../type';

export function removeTimeout(timerID: Timeout) {
    if (timeoutTimers.delete(timerID)) {
        clearTimeout(timerID);
    } else if (DEVELOPMENT) {
        console.error('Timeout not found.', timerID);
    }
}
