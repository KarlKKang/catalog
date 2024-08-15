import { elementMap } from './internal/element_map';
import { removeAllEventListenersHelper } from './internal/remove_all_listeners_helper';

export function offloadEventListeners() {
    for (const [elem, eventMap] of elementMap) {
        removeAllEventListenersHelper(elem, eventMap);
    }
    elementMap.clear();
    if (DEVELOPMENT) {
        console.log('All event listeners offloaded.');
    }
}
