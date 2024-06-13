import { getHostname } from '../dom/document';
import { TOP_DOMAIN } from './domain';

function spliteHostname() {
    const hostname = getHostname();
    const baseDomain = DEVELOPMENT ? ('alpha.' + TOP_DOMAIN) : TOP_DOMAIN;
    if (!hostname.endsWith('.' + baseDomain)) {
        return ['', hostname];
    }
    return [hostname.substring(0, hostname.length - baseDomain.length), baseDomain];
}
export function getServerOrigin() {
    const [locationPrefix, baseDomain] = spliteHostname();
    return 'https://' + locationPrefix + 'server.' + baseDomain;
}
export function getCDNOrigin() {
    const [locationPrefix, baseDomain] = spliteHostname();
    return 'https://' + locationPrefix + 'cdn.' + baseDomain;
}