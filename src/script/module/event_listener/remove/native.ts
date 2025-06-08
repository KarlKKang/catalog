export function removeEventListenerNative(elem: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions | boolean) {
    elem.removeEventListener(event, callback, options);
}
