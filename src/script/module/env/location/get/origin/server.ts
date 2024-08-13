import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getServerOrigin(locationPrefixOverride?: string) {
    const [locationPrefix, baseDomain] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefixOverride ?? locationPrefix, 'server.' + baseDomain);
}
