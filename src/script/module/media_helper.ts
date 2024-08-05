import { getTitle, openWindow } from './dom/document';
import { clearSessionStorage, setSessionStorage } from './dom/session_storage';
import { IMAGE_URI } from './env/uri';
import { addEventListener } from './event_listener';

export function removeRightClick(elem: Element) {
    addEventListener(elem, 'contextmenu', (event) => event.preventDefault());
}

export const enum ImageSessionTypes {
    MEDIA = 'media',
    NEWS = 'news',
}

export function openImageWindow(baseURL: string, fileName: string, credential: string, sessionType: ImageSessionTypes) {
    setSessionStorage('base-url', baseURL);
    setSessionStorage('file-name', fileName);
    setSessionStorage('title', getTitle());
    setSessionStorage('session-credential', credential);
    setSessionStorage('session-type', sessionType);
    openWindow(IMAGE_URI);
    clearSessionStorage();
}
