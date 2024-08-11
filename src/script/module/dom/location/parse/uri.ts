import { windowLocation } from '..';

export function parseURI(url: string | URL) {
    try {
        return new URL(url, windowLocation.origin).pathname;
    } catch {
        return null;
    }
}
