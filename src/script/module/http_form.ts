const _encodeURIComponent = encodeURIComponent;

export function encodeCFURIComponent(uri: string) {
    return _encodeURIComponent(uri).replace(/%20/g, '+');
}

export function buildURLForm(params: Record<string, string | number | undefined | null>) {
    const result: string[] = [];
    for (const key in params) {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '') {
            result.push(_encodeURIComponent(key) + '=' + _encodeURIComponent(val));
        }
    }
    return result.join('&');
}

export function joinURLForms(...forms: (string | undefined)[]) {
    return forms.filter((form) => form !== undefined && form !== '').join('&');
}

export function buildURI(uri: string, query: string | undefined | null, hash?: string | undefined | null) {
    if (query !== undefined && query !== null && query !== '') {
        uri += '?' + query;
    }
    if (hash !== undefined && hash !== null && hash !== '') {
        uri += '#' + hash;
    }
    return uri;
}
