import { timeoutTimers } from '../internal/timeout_timers';
import { Timeout } from '../type';
import { removeTimeoutNative } from './native/timeout';

export function removeTimeout(timerID: Timeout) {
    if (timeoutTimers.delete(timerID)) {
        removeTimeoutNative(timerID);
        if (ENABLE_DEBUG) {
            console.log(`Timeout removed. Total timeouts: ${timeoutTimers.size}.`, timerID);
        }
    } else if (ENABLE_DEBUG) {
        console.error('Timeout not found.', timerID);
    }
}
