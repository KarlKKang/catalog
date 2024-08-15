import { removeAllEventListenersHelper } from '../internal/remove_all_listeners_helper';
import { elementMap } from '../internal/element_map';

export function removeAllEventListeners(elem: EventTarget) {
    const eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        if (DEVELOPMENT) {
            console.error('Event map not found.', elem);
        }
        return;
    }
    removeAllEventListenersHelper(elem, eventMap);
    elementMap.delete(elem);
    if (DEVELOPMENT) {
        console.log('All event listeners removed. Total elements listening: ' + elementMap.size + '.', elem);
    }
}
