import { intervalTimers } from './internal/interval_timers';
import { timeoutTimers } from './internal/timeout_timers';

export function offloadTimers() {
    offloadTimerSet(timeoutTimers, clearTimeout);
    offloadTimerSet(intervalTimers, clearInterval);
}

function offloadTimerSet<T>(timerSet: Set<T>, offloadCallback: (timer: T) => void) {
    for (const timer of timerSet) {
        offloadCallback(timer);
    }
    timerSet.clear();
}
