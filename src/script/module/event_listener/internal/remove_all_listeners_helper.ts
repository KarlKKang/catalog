import { removeEventListenerNative } from '../remove/native';
import type { EventMap } from './type';

export function removeAllEventListenersHelper(elem: EventTarget, eventMap: EventMap) {
    for (const [event, listenerMap] of eventMap) {
        for (const listenerConfig of listenerMap.values()) {
            for (const i of [0, 1] as const) {
                const eventListenerAndOptions = listenerConfig[i];
                if (eventListenerAndOptions !== null) {
                    removeEventListenerNative(elem, event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
                    listenerConfig[i] = null;
                }
            }
        }
        listenerMap.clear();
    }
    eventMap.clear();
}
