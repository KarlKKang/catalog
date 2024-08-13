import { getHost } from '../../../dom/location/get/host';
import { getLocationPrefix } from './prefix';

export function getBaseHost() {
    const host = getHost();
    return host.substring(getLocationPrefix().length);
}
