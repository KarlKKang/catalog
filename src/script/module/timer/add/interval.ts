import { intervalTimers } from '../internal/interval_timers';

export function addInterval(callback: () => void, ms?: number) {
    const timerID = setInterval(() => {
        if (intervalTimers.has(timerID)) {
            callback();
        }
    }, ms);
    intervalTimers.add(timerID);
    return timerID;
}
