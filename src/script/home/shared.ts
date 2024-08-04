import { getSearchParam } from '../module/dom/document';

export let search: ((useURLKeywords: boolean) => void) | null = null;
export function setSearch(func: ((useURLKeywords: boolean) => void) | null) {
    search = func;
}

export function getURLKeywords() {
    const urlParam = getSearchParam('keywords');
    if (urlParam === null) {
        return '';
    } else {
        return decodeURIComponent(urlParam).substring(0, 50);
    }
}
