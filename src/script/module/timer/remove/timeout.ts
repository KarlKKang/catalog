import { timeoutTimers } from '../internal/timeout_timers';
import { Timeout } from '../type';

export function removeTimeout(timerID: Timeout) {
    clearTimeout(timerID);
    timeoutTimers.delete(timerID);
}
