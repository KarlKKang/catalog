import { isUseCapture } from '../internal/is_use_capture';
import { elementMap } from '../internal/element_map';
import type { CustomAddEventListenerOptions } from '../internal/type';
import { addEventListenerNative } from './native';

export function addEventListener(elem: EventTarget, event: string, callback: EventListener, options?: boolean | CustomAddEventListenerOptions) {
    let eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        eventMap = new Map();
        elementMap.set(elem, eventMap);
    }
    let listenerMap = eventMap.get(event);
    if (listenerMap === undefined) {
        listenerMap = new Map();
        eventMap.set(event, listenerMap);
    }
    if (ENABLE_DEBUG) {
        if (listenerMap.size > 5) {
            console.warn(`This element has ${listenerMap.size} listeners on event '${event}'.`, elem);
        }
    }
    let listenerConfig = listenerMap.get(callback);
    const useCapture = isUseCapture(options);
    const listenerConfigIdx = useCapture ? 1 : 0;
    if (listenerConfig === undefined) {
        listenerConfig = [null, null];
        listenerMap.set(callback, listenerConfig);
    } else if (listenerConfig[listenerConfigIdx] !== null) {
        if (ENABLE_DEBUG) {
            console.error('Listener already added.', elem, event, callback, useCapture);
        }
        return;
    }
    const _listenerConfig = listenerConfig;
    const _callback = (...args: Parameters<EventListener>) => {
        const eventListenerAndOptions = _listenerConfig[listenerConfigIdx];
        if (eventListenerAndOptions === null || eventListenerAndOptions[0] !== _callback) {
            return;
        }
        callback.apply(elem, args);
    };
    listenerConfig[listenerConfigIdx] = [_callback, options];
    addEventListenerNative(elem, event, _callback, options);
    if (ENABLE_DEBUG) {
        console.log(`Event '${event}' listener added. Total elements listening: ${elementMap.size}. Total events on this element: ${eventMap.size}. Total listeners on this event: ${listenerMap.size}.`, elem);
    }
}
