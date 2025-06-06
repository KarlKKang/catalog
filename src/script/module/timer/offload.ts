import { intervalTimers } from './internal/interval_timers';
import { timeoutTimers } from './internal/timeout_timers';
import { removeIntervalNative } from './remove/native/interval';
import { removeTimeoutNative } from './remove/native/timeout';

export function offloadTimers() {
    offloadTimerSet(timeoutTimers, removeTimeoutNative);
    offloadTimerSet(intervalTimers, removeIntervalNative);
    if (ENABLE_DEBUG) {
        console.log('All timers offloaded.');
    }
}

function offloadTimerSet<T>(timerSet: Set<T>, offloadCallback: (timer: T) => void) {
    for (const timer of timerSet) {
        offloadCallback(timer);
    }
    timerSet.clear();
}
