import { addEventListener, removeAllEventListeners } from './event_listener';
import { addOffloadCallback } from './global';

const allRequests = new Set<XMLHttpRequest>();

export function newXHR(
    url: string,
    method: 'GET' | 'POST',
    withCredentials: boolean,
    callback: () => void,
) {
    addOffloadCallback(abortAllXhr);
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
    return xhr;
}

function abortAllXhr() {
    for (const xhr of allRequests) {
        removeAllEventListeners(xhr);
        xhr.abort();
    }
    allRequests.clear();
}

export function abortXhr(xhr: XMLHttpRequest) {
    removeAllEventListeners(xhr);
    xhr.abort();
    allRequests.delete(xhr);
}
