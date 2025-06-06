export function addEventListenerNative(elem: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions | boolean) {
    elem.addEventListener(event, callback, options);
}
