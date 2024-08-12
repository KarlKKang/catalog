import { _encodeURIComponent } from '../../internal/encode_uri_component';

export function encodeCloudfrontURIComponent(uri: string) {
    return _encodeURIComponent(uri).replace(/%20/g, '+');
}
