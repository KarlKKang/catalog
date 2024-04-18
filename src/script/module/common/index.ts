import {
    TOP_URL
} from '../env/constant';
import { clearSessionStorage, getHash, getTitle, openWindow, setSessionStorage, w, windowLocation } from '../dom/document';
import { getByIdNative } from '../dom/element';
import { addEventListener } from '../dom/event_listener';
import { addTimeout } from '../timer';

export function getURLParam(name: string): string | null {
    const urlObj = new URL(windowLocation.href);
    return urlObj.searchParams.get(name);
}

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
    openWindow(TOP_URL + '/image');
    clearSessionStorage();
}