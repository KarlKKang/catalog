import { getHostname } from '../../../dom/location/get/hostname';
import { TOP_DOMAIN } from '../../domain';

export function splitHostname() {
    const hostname = getHostname();
    const baseDomain = DEVELOPMENT ? ('alpha.' + TOP_DOMAIN) : TOP_DOMAIN;
    if (!hostname.endsWith('.' + baseDomain)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseDomain.length), baseDomain] as const;
}
