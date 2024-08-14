const offloadCallbacks = new Set<() => void>();

export function addOffloadCallback(callback: () => void) {
    offloadCallbacks.add(callback);
}

export function offload() {
    const callbacksArray = [...offloadCallbacks];
    offloadCallbacks.clear();
    let callback = callbacksArray.pop();
    while (callback !== undefined) {
        callback();
        callback = callbacksArray.pop();
    }
}
