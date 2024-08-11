import { windowLocation } from '..';

export function getHash() {
    return windowLocation.hash.substring(1);
}
