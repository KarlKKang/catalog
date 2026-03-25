import { encodeURIComponentWrapped } from '../encode_uri_component';

export function buildHttpForm(params: Record<string, string | number | undefined | null>) {
    const result: string[] = [];
    for (const key in params) {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '') {
            result.push(encodeURIComponentWrapped(key) + '=' + encodeURIComponentWrapped(val));
        }
    }
    return result.join('&');
}
