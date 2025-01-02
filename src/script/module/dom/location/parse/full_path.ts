import { windowLocation } from '..';

export function parseFullPath(url: string | URL) {
    try {
        const parser = new URL(url, windowLocation.origin);
        return parser.pathname + parser.search + parser.hash;
    } catch {
        return null;
    }
}
