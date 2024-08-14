const offloadCallbacks = new Set<() => void>();

export function addOffloadCallback(callback: () => void) {
    offloadCallbacks.add(callback);
}

export function offload() {
    const callbacksArray = Array.from(offloadCallbacks);
    offloadCallbacks.clear();
    let callback = callbacksArray.pop();
    while (callback !== undefined) {
        callback();
        callback = callbacksArray.pop();
    }
}
