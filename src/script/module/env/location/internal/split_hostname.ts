import { getHostname } from '../../../dom/location/get/hostname';
import { baseHostname } from '../get/base_hostname';

export function splitHostname() {
    const hostname = getHostname();
    if (!hostname.endsWith('.' + baseHostname)) {
        return ['', hostname] as const;
    }
    return [hostname.substring(0, hostname.length - baseHostname.length), baseHostname] as const;
}
