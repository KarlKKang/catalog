import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allRequests } from './internal/all_requests';

export function abortXhr(xhr: XMLHttpRequest) {
    if (allRequests.delete(xhr)) {
        removeAllEventListeners(xhr);
        xhr.abort();
        if (DEVELOPMENT) {
            console.log(`XHR aborted. Total XHRs: ${allRequests.size}.`, xhr);
        }
    } else if (DEVELOPMENT) {
        console.error('XHR not found.', xhr);
    }
}
