import { timeoutTimers } from '../internal/timeout_timers';
import { addTimeoutNative } from './native/timeout';

export function addTimeout(callback: () => void, ms?: number) {
    const timerID = addTimeoutNative(() => {
        if (timeoutTimers.delete(timerID)) {
            if (ENABLE_DEBUG) {
                console.log(`Timeout triggered. Total timeouts: ${timeoutTimers.size}.`, timerID);
            }
            callback();
        }
    }, ms);
    timeoutTimers.add(timerID);
    if (ENABLE_DEBUG) {
        console.log(`Timeout added. Total timeouts: ${timeoutTimers.size}.`, timerID);
    }
    return timerID;
}
