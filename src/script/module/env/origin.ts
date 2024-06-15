import { getHostname } from '../dom/document';
import { TOP_DOMAIN } from './domain';

export function splitHostname() {
    const hostname = getHostname();
    const baseDomain = DEVELOPMENT ? ('alpha.' + TOP_DOMAIN) : TOP_DOMAIN;
    if (!hostname.endsWith('.' + baseDomain)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseDomain.length), baseDomain] as const;
}
export function getServerOrigin(locationPrefixOverride?: string) {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + (locationPrefixOverride ?? locationPrefix) + 'server.' + baseDomain;
}
export function getCDNOrigin() {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + locationPrefix + 'cdn.' + baseDomain;
}