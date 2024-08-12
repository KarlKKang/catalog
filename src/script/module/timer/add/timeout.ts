import { addOffloadCallback } from '../../global';
import { removeAllTimers } from '../internal/remove_all';
import { timeoutTimers } from '../internal/timeout_timers';

export function addTimeout(callback: () => void, ms?: number) {
    addOffloadCallback(removeAllTimers);
    const timerID = setTimeout(() => {
        if (timeoutTimers.delete(timerID)) {
            callback();
        }
    }, ms);
    timeoutTimers.add(timerID);
    return timerID;
}
