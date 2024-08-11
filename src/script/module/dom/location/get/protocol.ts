import { windowLocation } from '..';

export function getProtocol() {
    return windowLocation.protocol.toLowerCase();
}
