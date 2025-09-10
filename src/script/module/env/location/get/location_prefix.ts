import { splitHostname } from '../internal/split_hostname';

export function getLocationPrefix() {
    return splitHostname()[0];
}
