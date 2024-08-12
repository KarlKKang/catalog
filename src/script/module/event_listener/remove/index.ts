import { elementMap } from '../internal/element_map';

export function removeEventListener(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    const eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Event map not found.', elem);
        }
        return;
    }
    const listenerMap = eventMap.get(event);
    if (listenerMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Listener map not found.', elem, event);
        }
        return;
    }
    const listenerConfig = listenerMap.get(callback);
    if (listenerConfig === undefined) {
        if (DEVELOPMENT) {
            console.warn('Listener config not found.', elem, event, callback);
        }
        return;
    }
    const listenerConfigIdx = useCapture ? 1 : 0;
    const eventListenerAndOptions = listenerConfig[listenerConfigIdx];
    if (eventListenerAndOptions === null) {
        if (DEVELOPMENT) {
            console.warn('Listener config not set.', elem, event, callback, useCapture);
        }
        return;
    }
    elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
    listenerConfig[listenerConfigIdx] = null;

    if (listenerConfig[0] === null && listenerConfig[1] === null) {
        listenerMap.delete(callback);
    }
    if (listenerMap.size === 0) {
        eventMap.delete(event);
    }
    if (eventMap.size === 0) {
        elementMap.delete(elem);
    }
    if (DEVELOPMENT) {
        console.log('Event listener removed. Total elements listening: ' + elementMap.size + '. Total events on this element: ' + eventMap.size + '. Total listeners on this event: ' + listenerMap.size + '.');
    }
}
