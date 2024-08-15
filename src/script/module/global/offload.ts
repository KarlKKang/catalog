const offloadCallbacks = new Set<() => void>();

export function addOffloadCallback(callback: () => void) {
    offloadCallbacks.add(callback);
}

export function offload() {
    for (const callback of offloadCallbacks) {
        callback();
    }
    offloadCallbacks.clear();
}
