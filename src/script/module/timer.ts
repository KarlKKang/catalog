export type Timeout = ReturnType<typeof setTimeout>;
export type Interval = ReturnType<typeof setInterval>;

const timeoutTimers = new Set<Timeout>();
const intervalTimers = new Set<Interval>();

export function addTimeout(callback: () => void, ms?: number) {
    const timerID = setTimeout(
        () => {
            if (timeoutTimers.delete(timerID)) {
                callback();
            }
        },
        ms,
    );
    timeoutTimers.add(timerID);
    return timerID;
}

export function addInterval(callback: () => void, ms?: number) {
    const timerID = setInterval(() => {
        if (intervalTimers.has(timerID)) {
            callback();
        }
    }, ms);
    intervalTimers.add(timerID);
    return timerID;
}

export function removeTimeout(timerID: Timeout) {
    clearTimeout(timerID);
    timeoutTimers.delete(timerID);
}

export function removeInterval(timerID: Interval) {
    clearInterval(timerID);
    intervalTimers.delete(timerID);
}

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
