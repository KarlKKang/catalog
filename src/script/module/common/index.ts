import { clearSessionStorage, getHash, getTitle, openWindow, setSessionStorage, w } from '../dom/document';
import { getByIdNative } from '../dom/element';
import { IMAGE_URI } from '../env/uri';
import { addEventListener, removeAllEventListeners } from '../event_listener';
import { addTimeout } from '../timer';

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}

export function removeRightClick(elem: Element) {
    addEventListener(elem, 'contextmenu', (event) => event.preventDefault());
}

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getByIdNative(scrollID);
        if (elem !== null) {
            addTimeout(() => {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); //Give UI some time to load.
        }
    }
}

export const enum SessionTypes {
    MEDIA = 'media',
    NEWS = 'news'
}

export function openImageWindow(baseURL: string, fileName: string, credential: string, sessionType: SessionTypes) {
    setSessionStorage('base-url', baseURL);
    setSessionStorage('file-name', fileName);
    setSessionStorage('title', getTitle());
    setSessionStorage('session-credential', credential);
    setSessionStorage('session-type', sessionType);
    openWindow(IMAGE_URI);
    clearSessionStorage();
}

export function newXHR(
    url: string,
    method: 'GET' | 'POST',
    withCredentials: boolean,
    callback: () => void,
) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = withCredentials;
    addEventListener(xhr, 'load', () => {
        callback();
    });
    addEventListener(xhr, 'loadend', () => {
        removeAllEventListeners(xhr);
    });
    if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    return xhr;
}