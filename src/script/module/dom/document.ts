// Low level DOM functions, required in ./message
import {
    TOP_URL
} from '../env/constant';
import { STATE_TRACKER } from '../global';

export const d = document;
export const w = window;
export const html = d.documentElement;
const windowLocation = w.location;

export function getFullURL() {
    return windowLocation.href;
}

export function getBaseURL(url?: string): string {
    if (url === undefined) {
        url = getFullURL();
    }

    const protocolIndex = url.indexOf('://');
    let protocol = '';
    if (protocolIndex >= 0) {
        protocol = url.substring(0, protocolIndex + 3);
        url = url.substring(protocolIndex + 3);
    }

    const atIndex = url.lastIndexOf('@');
    url = url.substring(atIndex + 1);

    const hashIndex = url.indexOf('#');
    if (hashIndex >= 0) {
        url = url.substring(0, hashIndex);
    }

    const queryIndex = url.indexOf('?');
    if (queryIndex >= 0) {
        url = url.substring(0, queryIndex);
    }

    if (url.endsWith('/')) {
        const urlTrimmed = url.substring(0, url.length - 1);
        if (!urlTrimmed.includes('/')) {
            url = urlTrimmed;
        }
    }

    return protocol + url;
}

export function getHash() {
    return windowLocation.hash.substring(1);
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
        windowLocation.replace(TOP_URL + '/unsupported_browser');
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