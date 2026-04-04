import { urlencode } from './urlencode';

export function buildHttpForm(params: Record<string, string | number | undefined | null>) {
    const result: string[] = [];
    for (const key in params) {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '') {
            result.push(urlencode(key) + '=' + urlencode(val));
        }
    }
    return result.join('&');
}
