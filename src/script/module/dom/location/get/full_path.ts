import { windowLocation } from '..';
import { getHash } from './hash';
import { getSearch } from './search';

export function getFullPath() {
    return windowLocation.pathname + getSearch() + getHash();
}
