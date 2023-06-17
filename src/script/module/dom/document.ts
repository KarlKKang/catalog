// Low level DOM functions, required in ./message
import {
    DOMAIN
} from '../env/constant';

export const d = document;
export const w = window;
const windowLocation = w.location;

export function getBody() {
    return d.body;
}

export function getBaseURL(url?: string): string {
    if (url === undefined) {
        url = windowLocation.href;
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

export function redirect(url: string, withoutHistory?: boolean) {
    if (withoutHistory === true) {
        windowLocation.replace(url);
    } else {
        windowLocation.href = url;
    }
}

export function changeURL(url: string, withoutHistory?: boolean) {
    if (withoutHistory === true) {
        history.replaceState(null, '', url);
    } else {
        history.pushState(null, '', url);
    }
}

export function openWindow(url: string) {
    w.open(url);
}

export function getCookie(name: string) {
    name = name + '=';
    // var decodedCookie = decodeURIComponent(document.cookie);
    const decodedCookies = d.cookie;
    const cookies = decodedCookies.split(';');
    for (let cookie of cookies) {
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
}

export function setCookie(name: string, value: string, maxAge: number) {
    d.cookie = name + '=' + encodeURIComponent(value) + ';max-age=' + maxAge.toString() + ';path=/;domain=.' + DOMAIN + ';secure;samesite=strict';
}

export function deleteCookie(name: string) {
    d.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.' + DOMAIN + ';secure;samesite=strict';
}

export function getTitle() {
    return d.title;
}

export function setTitle(title: string) {
    d.title = title;
}