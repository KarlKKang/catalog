import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getMediaCDNOrigin() {
    const [locationPrefix, baseHostname] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefix, 'media.' + baseHostname);
}
