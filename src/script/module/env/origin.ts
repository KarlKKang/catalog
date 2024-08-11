import { getHostname } from '../dom/location/get/hostname';
import { getHost } from '../dom/location/get/host';
import { TOP_DOMAIN } from './domain';

function splitHostname() {
    const hostname = getHostname();
    const baseDomain = DEVELOPMENT ? ('alpha.' + TOP_DOMAIN) : TOP_DOMAIN;
    if (!hostname.endsWith('.' + baseDomain)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseDomain.length), baseDomain] as const;
}
export function getLocationPrefix() {
    return splitHostname()[0];
}
export function getBaseHost() {
    const host = getHost();
    return host.substring(getLocationPrefix().length);
}
export function concatenateLocationPrefix(locationPrefix: string, baseHost: string) {
    return locationPrefix + baseHost;
}
export function locationCodeToPrefix(locationCode: string) {
    if (locationCode === '') {
        return '';
    }
    return locationCode + '.';
}
export function getServerOrigin(locationPrefixOverride?: string) {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + concatenateLocationPrefix(locationPrefixOverride ?? locationPrefix, 'server.' + baseDomain);
}
export function getCDNOrigin() {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + concatenateLocationPrefix(locationPrefix, 'cdn.' + baseDomain);
}
