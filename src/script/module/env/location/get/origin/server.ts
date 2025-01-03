import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getServerOrigin(locationPrefixOverride?: string) {
    const [locationPrefix, baseHost] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefixOverride ?? locationPrefix, 'server.' + baseHost);
}
