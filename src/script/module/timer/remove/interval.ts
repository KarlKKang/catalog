import { intervalTimers } from '../internal/interval_timers';
import { Interval } from '../type';

export function removeInterval(timerID: Interval) {
    if (intervalTimers.delete(timerID)) {
        clearInterval(timerID);
    } else if (DEVELOPMENT) {
        console.error('Interval not found.', timerID);
    }
}
