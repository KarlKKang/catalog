import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allRequests } from './internal/all_requests';

export function offloadXhr() {
    for (const xhr of allRequests) {
        removeAllEventListeners(xhr);
        xhr.abort();
    }
    allRequests.clear();
    if (ENABLE_DEBUG) {
        console.log('All XHRs offloaded.');
    }
}
