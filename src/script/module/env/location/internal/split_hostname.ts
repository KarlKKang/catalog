import { getHostname } from '../../../dom/location/get/hostname';
import { TOP_DOMAIN } from '../../domain';

export function splitHostname() {
    const hostname = getHostname();
    const baseHostname = ENV_WEBSITE_SUBDOMAIN_PREFIX + TOP_DOMAIN;
    if (!hostname.endsWith('.' + baseHostname)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseHostname.length), baseHostname] as const;
}
