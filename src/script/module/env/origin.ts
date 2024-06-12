import { getHostname } from '../dom/document';

export function getServerOrigin() {
    return 'https://server.' + getHostname();
}
export function getCDNOrigin() {
    return 'https://cdn.' + getHostname();
}