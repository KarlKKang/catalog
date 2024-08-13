import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getCDNOrigin() {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefix, 'cdn.' + baseDomain);
}
