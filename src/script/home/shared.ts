import { getSearchParam } from '../module/dom/location/get/search_param';
import { addOffloadCallback } from '../module/global/offload';

export let search: ((useURLKeywords: boolean) => void) | null = null;
export function setSearch(func: ((useURLKeywords: boolean) => void)) {
    addOffloadCallback(dereferenceSearch);
    search = func;
}
function dereferenceSearch() {
    search = null;
}

export function getURLKeywords() {
    const urlParam = getSearchParam('keywords');
    if (urlParam === null) {
        return '';
    } else {
        return decodeURIComponent(urlParam).substring(0, 50);
    }
}
