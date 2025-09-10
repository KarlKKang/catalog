import { getHostname } from '../../../dom/location/get/hostname';
import { WEBSITE_APEX_HOSTNAME } from '../../website_apex_hostname';

export function splitHostname() {
    const hostname = getHostname();
    const baseHostname = ENV_WEBSITE_HOSTNAME_PREFIX + WEBSITE_APEX_HOSTNAME;
    if (!hostname.endsWith('.' + baseHostname)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseHostname.length), baseHostname] as const;
}
