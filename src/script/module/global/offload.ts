const offloadCallbacks = [new Set<() => void>(), new Set<() => void>()] as const;

export function addOffloadCallback(callback: () => void, lowLevel = false) {
    offloadCallbacks[lowLevel ? 1 : 0].add(callback);
}

export function offload() {
    for (const callbackSet of offloadCallbacks) {
        for (const callback of callbackSet) {
            callback();
        }
        callbackSet.clear();
    }
}
