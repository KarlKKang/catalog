import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allRequests } from './internal/all_requests';

export function abortXhr(xhr: XMLHttpRequest) {
    removeAllEventListeners(xhr);
    xhr.abort();
    allRequests.delete(xhr);
}
