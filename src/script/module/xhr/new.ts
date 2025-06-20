import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { addEventListener } from '../event_listener/add';
import { allRequests } from './internal/all_requests';

export function newXhr(
    url: string,
    method: 'GET' | 'POST',
    withCredentials: boolean,
    callback: () => void,
    loadendCallback?: () => void,
) {
    const xhr = new XMLHttpRequest();
    allRequests.add(xhr);
    if (ENABLE_DEBUG) {
        console.log(`XHR to ${url} created. Total XHRs: ${allRequests.size}.`, xhr);
    }
    xhr.open(method, url, true);
    xhr.withCredentials = withCredentials;
    addEventListener(xhr, 'load', () => {
        callback();
    });
    addEventListener(xhr, 'loadend', () => {
        loadendCallback?.();
        allRequests.delete(xhr);
        removeAllEventListeners(xhr);
        if (ENABLE_DEBUG) {
            console.log(`XHR to ${url} completed. Total XHRs: ${allRequests.size}.`, xhr);
        }
    });
    if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    return xhr;
}
