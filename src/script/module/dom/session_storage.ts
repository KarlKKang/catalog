import { w, windowLocation } from './document';

export function setSessionStorage(key: string, value: string) {
    try {
        w.sessionStorage.setItem(key, value);
    } catch (e) {
        windowLocation.replace('/unsupported_browser');
        throw e;
    }
}

export function getSessionStorage(key: string) {
    return w.sessionStorage.getItem(key);
}

export function clearSessionStorage() {
    w.sessionStorage.clear();
}
