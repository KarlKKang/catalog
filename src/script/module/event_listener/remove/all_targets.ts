import { removeAllEventListenersHelper } from './internal/all_listeners_helper';
import { elementMap } from '../internal/element_map';

export function deregisterAllEventTargets() {
    for (const [elem, eventMap] of elementMap) {
        removeAllEventListenersHelper(elem, eventMap);
    }
}
