import { intervalTimers } from '../internal/interval_timers';
import { Interval } from '../type';

export function removeInterval(timerID: Interval) {
    if (intervalTimers.delete(timerID)) {
        clearInterval(timerID);
        if (ENABLE_DEBUG) {
            console.log(`Interval removed. Total intervals: ${intervalTimers.size}.`, timerID);
        }
    } else if (ENABLE_DEBUG) {
        console.error('Interval not found.', timerID);
    }
}
