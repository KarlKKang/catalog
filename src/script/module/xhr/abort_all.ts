import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allRequests } from './internal/all_requests';

export function abortAllXhr() {
    for (const xhr of allRequests) {
        removeAllEventListeners(xhr);
        xhr.abort();
    }
    allRequests.clear();
}
