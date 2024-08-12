import { addOffloadCallback } from '../../global';
import { intervalTimers } from '../internal/interval_timers';
import { removeAllTimers } from '../internal/remove_all';

export function addInterval(callback: () => void, ms?: number) {
    addOffloadCallback(removeAllTimers);
    const timerID = setInterval(() => {
        if (intervalTimers.has(timerID)) {
            callback();
        }
    }, ms);
    intervalTimers.add(timerID);
    return timerID;
}
