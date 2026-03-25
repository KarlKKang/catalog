import { encodeURIComponentWrapped } from '../../encode_uri_component';

export function encodeCloudfrontURIComponent(uri: string) {
    return encodeURIComponentWrapped(uri).replace(/%20/g, '+');
}
