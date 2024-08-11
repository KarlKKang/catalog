import { windowLocation } from '..';

export function getURI() {
    return windowLocation.pathname;
}
