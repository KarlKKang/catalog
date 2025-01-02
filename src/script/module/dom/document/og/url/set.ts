import { getBaseHost } from '../../../../env/location/get/base_host';
import { getProtocol } from '../../../location/get/protocol';
import { OG_PROPERTY } from '../internal/property';
import { setOgProperty } from '../internal/set';

export function setOgUrl(uri: string) {
    // Use base host to ignore location prefix
    setOgProperty(OG_PROPERTY.URL, getProtocol() + '//' + getBaseHost() + uri);
}
