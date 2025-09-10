import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getMediaCDNOrigin() {
    const [locationPrefix, baseHost] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefix, 'media.' + baseHost);
}
