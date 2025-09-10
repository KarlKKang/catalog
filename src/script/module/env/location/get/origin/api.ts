import { splitHostname } from '../../internal/split_hostname';
import { concatenateLocationPrefixToHost } from '../../build/host';

export function getAPIOrigin(locationPrefixOverride?: string) {
    const [locationPrefix, baseHostname] = splitHostname();
    return 'https://' + concatenateLocationPrefixToHost(locationPrefixOverride ?? locationPrefix, 'api.' + baseHostname);
}
