import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allRequests } from './internal/all_requests';

export function abortXhr(xhr: XMLHttpRequest) {
    if (allRequests.delete(xhr)) {
        removeAllEventListeners(xhr);
        xhr.abort();
        if (ENABLE_DEBUG) {
            console.log(`XHR aborted. Total XHRs: ${allRequests.size}.`, xhr);
        }
    } else if (ENABLE_DEBUG) {
        console.error('XHR not found.', xhr);
    }
}
