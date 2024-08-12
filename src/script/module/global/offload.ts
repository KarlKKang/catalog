const offloadCallbacks = new Set<() => void>();
const lowLevelOffloadCallbacks = new Set<() => void>();

export function addOffloadCallback(callback: () => void, lowLevel = false) {
    if (lowLevel) {
        lowLevelOffloadCallbacks.add(callback);
    } else {
        offloadCallbacks.add(callback);
    }
}

export function offload() {
    for (const callback of offloadCallbacks) {
        callback();
    }
    offloadCallbacks.clear();
    for (const callback of lowLevelOffloadCallbacks) {
        callback();
    }
    lowLevelOffloadCallbacks.clear();
}
