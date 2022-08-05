// Low level DOM functions, required in ./message
import {
    TOP_URL,
    LOGIN_URL,
    DEVELOPMENT
} from '../env/constant';

export const d = document;
export const w = window;
const windowLocation = w.location;

export function getBody() {
    return d.body;
}

export function getHref(): string {
    const href = windowLocation.href;
    if (href == TOP_URL + '/' || href == LOGIN_URL + '/') { //When the trailing slash is included for root pages
        return href.substring(0, href.length - 1);
    }
    return href;
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
    name = name + "=";
    // var decodedCookie = decodeURIComponent(document.cookie);
    var decodedCookies = d.cookie;
    var cookies = decodedCookies.split(';');
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
    d.cookie = name + '=' + encodeURIComponent(value) + ';max-age=' + maxAge.toString() + ';path=/' + (DEVELOPMENT ? '' : ';domain=.featherine.com;secure;samesite=strict');
}

export function deleteCookie(name: string) {
    d.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (DEVELOPMENT ? '' : ';domain=.featherine.com;secure;samesite=strict');
}

export function getTitle() {
    return d.title;
}

export function setTitle(title: string) {
    d.title = title;
}