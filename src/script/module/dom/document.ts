import { STATE_TRACKER } from '../global';

export const d = document;
export const w = window;
export const html = d.documentElement;
export const windowLocation = w.location;

function getHref() {
    return windowLocation.href;
}

function getOrigin() {
    return windowLocation.origin;
}

export function getURI(url?: string | URL): string {
    if (url === undefined) {
        url = getHref();
    }

    const urlObj = new URL(url, getOrigin());
    return urlObj.pathname;
}

export function getHostname(url?: string | URL) {
    if (url === undefined) {
        url = getHref();
    }

    const urlObj = new URL(url, getOrigin());
    return urlObj.hostname;
}

export function getFullPath(url?: string | URL) {
    if (url === undefined) {
        url = getHref();
    }

    const urlObj = new URL(url, getOrigin());
    return urlObj.pathname + urlObj.search + urlObj.hash;
}

export function getHash() {
    return windowLocation.hash.substring(1);
}

export function getSearchParam(name: string): string | null {
    const urlObj = new URL(getHref());
    return urlObj.searchParams.get(name);
}

export function changeURL(url: string, withoutHistory?: boolean) {
    if (withoutHistory === true) {
        history.replaceState(STATE_TRACKER, '', url);
    } else {
        history.pushState(STATE_TRACKER, '', url);
    }
}

export function openWindow(url: string) {
    w.open(url);
}

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

export function getTitle() {
    return d.title;
}

export function setTitle(title: string) {
    d.title = title;
}