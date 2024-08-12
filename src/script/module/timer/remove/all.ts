import { intervalTimers } from '../internal/interval_timers';
import { timeoutTimers } from '../internal/timeout_timers';

export function removeAllTimers() {
    for (const timerID of timeoutTimers) {
        clearTimeout(timerID);
    }
    for (const timerID of intervalTimers) {
        clearInterval(timerID);
    }
    timeoutTimers.clear();
    intervalTimers.clear();
}
