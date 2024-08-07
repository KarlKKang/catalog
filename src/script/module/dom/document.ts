import { STATE_TRACKER } from '../global';

export const d = document;
export const w = window;
export const html = d.documentElement;
export const windowLocation = w.location;

export function parseOrigin(url: string | URL) {
    try {
        return new URL(url).origin.toLowerCase();
    } catch (e) {
        return null;
    }
}

export function getURI() {
    return windowLocation.pathname;
}

export function parseURI(url: string | URL) {
    try {
        return new URL(url, windowLocation.origin).pathname;
    } catch (e) {
        return null;
    }
}

export function getHostname() {
    return windowLocation.hostname.toLowerCase();
}

export function getFullPath() {
    return windowLocation.pathname + windowLocation.search + windowLocation.hash;
}

export function getHash() {
    return windowLocation.hash.substring(1);
}

export function getProtocol() {
    return windowLocation.protocol.toLowerCase();
}

export function getHost() {
    return windowLocation.host.toLowerCase();
}

export function getSearchParam(name: string): string | null {
    const urlObj = new URL(windowLocation.href);
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