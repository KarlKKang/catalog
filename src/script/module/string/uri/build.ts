export function buildURI(uri: string, query: string | undefined | null, hash?: string | undefined | null) {
    if (query !== undefined && query !== null && query !== '') {
        uri += '?' + query;
    }
    if (hash !== undefined && hash !== null && hash !== '') {
        uri += '#' + hash;
    }
    return uri;
}
