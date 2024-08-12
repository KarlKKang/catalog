import { isUseCapture } from '../internal/is_use_capture';
import { elementMap } from '../internal/element_map';
import type { CustomAddEventListenerOptions } from '../internal/type';

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
    if (DEVELOPMENT) {
        if (listenerMap.size > 5) {
            console.warn('More than 5 listeners on this event.', elem, event);
        }
    }
    let listenerConfig = listenerMap.get(callback);
    const useCapture = isUseCapture(options);
    const listenerConfigIdx = useCapture ? 1 : 0;
    if (listenerConfig === undefined) {
        listenerConfig = [null, null];
        listenerMap.set(callback, listenerConfig);
    } else if (listenerConfig[listenerConfigIdx] !== null) {
        if (DEVELOPMENT) {
            console.error('Listener already added.', elem, event, callback, useCapture);
        }
        return;
    }
    const _listenerConfig = listenerConfig;
    const _callback = (...args: [evt: Event]) => {
        const eventListenerAndOptions = _listenerConfig[listenerConfigIdx];
        if (eventListenerAndOptions === null || eventListenerAndOptions[0] !== _callback) {
            return;
        }
        callback.apply(elem, args);
    };
    listenerConfig[listenerConfigIdx] = [_callback, options];
    elem.addEventListener(event, _callback, options);
    if (DEVELOPMENT) {
        console.log('Event listener added. Total elements listening: ' + elementMap.size + '. Total events on this element: ' + eventMap.size + '. Total listeners on this event: ' + listenerMap.size + '.');
    }
}
