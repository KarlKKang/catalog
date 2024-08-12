import { intervalTimers } from '../internal/interval_timers';
import { Interval } from '../type';

export function removeInterval(timerID: Interval) {
    clearInterval(timerID);
    intervalTimers.delete(timerID);
}
