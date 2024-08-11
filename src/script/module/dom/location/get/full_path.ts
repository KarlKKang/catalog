import { windowLocation } from '..';

export function getFullPath() {
    return windowLocation.pathname + windowLocation.search + windowLocation.hash;
}
