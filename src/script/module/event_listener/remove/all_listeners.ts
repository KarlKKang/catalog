import { removeAllEventListenersHelper } from './internal/all_listeners_helper';
import { elementMap } from '../internal/element_map';

export function removeAllEventListeners(elem: EventTarget) {
    const eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Event map not found.', elem);
        }
        return;
    }
    removeAllEventListenersHelper(elem, eventMap);
}
