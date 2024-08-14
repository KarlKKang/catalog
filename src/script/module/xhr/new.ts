import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { addEventListener } from '../event_listener/add';
import { allRequests } from './internal/all_requests';
import { addOffloadCallback } from '../global/offload';

export function newXhr(
    url: string,
    method: 'GET' | 'POST',
    withCredentials: boolean,
    callback: () => void,
) {
    const xhr = new XMLHttpRequest();
    allRequests.add(xhr);
    xhr.open(method, url, true);
    xhr.withCredentials = withCredentials;
    addEventListener(xhr, 'load', () => {
        callback();
    });
    addEventListener(xhr, 'loadend', () => {
        allRequests.delete(xhr);
        removeAllEventListeners(xhr);
    });
    if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    addOffloadCallback(offload);
    return xhr;
}

function offload() {
    for (const xhr of allRequests) {
        removeAllEventListeners(xhr);
        xhr.abort();
    }
    allRequests.clear();
}
