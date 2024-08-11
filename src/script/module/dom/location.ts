import { STATE_TRACKER } from '../global';
import { w } from './window';

export const windowLocation = w.location;

export function parseOrigin(url: string | URL) {
    try {
        return new URL(url).origin.toLowerCase();
    } catch {
        return null;
    }
}

export function getURI() {
    return windowLocation.pathname;
}

export function parseURI(url: string | URL) {
    try {
        return new URL(url, windowLocation.origin).pathname;
    } catch {
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
