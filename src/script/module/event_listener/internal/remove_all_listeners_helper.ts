import type { EventMap } from './type';

export function removeAllEventListenersHelper(elem: EventTarget, eventMap: EventMap) {
    for (const [event, listenerMap] of eventMap) {
        for (const listenerConfig of listenerMap.values()) {
            let eventListenerAndOptions = listenerConfig[0];
            if (eventListenerAndOptions !== null) {
                elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
                listenerConfig[0] = null;
            }
            eventListenerAndOptions = listenerConfig[1];
            if (eventListenerAndOptions !== null) {
                elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
                listenerConfig[1] = null;
            }
        }
        listenerMap.clear();
    }
    eventMap.clear();
}
