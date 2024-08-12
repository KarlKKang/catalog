import { elementMap } from './element_map';
import type { EventMap } from './type';

export function removeAllEventListenersHelper(elem: EventTarget, eventMap: EventMap) {
    for (const [event, listenerMap] of eventMap) {
        for (const [callback, listenerConfig] of listenerMap) {
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
            listenerMap.delete(callback);
        }
        eventMap.delete(event);
    }
    elementMap.delete(elem);
    if (DEVELOPMENT) {
        console.log('All event listeners removed. Total elements listening: ' + elementMap.size + '.');
    }
}
