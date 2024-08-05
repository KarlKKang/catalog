import { getTitle, openWindow } from '../dom/document';
import { clearSessionStorage, setSessionStorage } from '../dom/session_storage';
import { IMAGE_URI } from '../env/uri';
import { addEventListener, removeAllEventListeners } from '../event_listener';

export function removeRightClick(elem: Element) {
    addEventListener(elem, 'contextmenu', (event) => event.preventDefault());
}

export const enum SessionTypes {
    MEDIA = 'media',
    NEWS = 'news',
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
