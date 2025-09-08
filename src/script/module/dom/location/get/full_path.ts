import { getHash } from './hash';
import { getSearch } from './search';
import { getURI } from './uri';

export function getFullPath() {
    return getURI() + getSearch() + getHash();
}
