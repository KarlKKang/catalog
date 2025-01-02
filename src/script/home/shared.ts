import { setTitle } from '../module/dom/document/title';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { setHistoryState } from '../module/dom/location/set/history_state';
import { TOP_URI } from '../module/env/uri';
import { addOffloadCallback } from '../module/global/offload';
import { buildHttpForm } from '../module/string/http_form/build';
import { buildURI } from '../module/string/uri/build';
import { topPageTitle } from '../module/text/page_title';

export let search: ((useURLKeywords: boolean) => void) | null = null;
export function setSearch(func: ((useURLKeywords: boolean) => void)) {
    addOffloadCallback(dereferenceSearch);
    search = func;
}
function dereferenceSearch() {
    search = null;
}

export function getURLKeywords() {
    const urlParam = decodeURIComponent(getSearchParam('keywords') ?? '').substring(0, 50);
    updateDocumentTitle(urlParam);
    return urlParam;
}

export function setURLKeywords(keywords: string) {
    setHistoryState(
        buildURI(TOP_URI, buildHttpForm({ keywords: keywords })),
    );
    updateDocumentTitle(keywords);
}

function updateDocumentTitle(keywords: string) {
    if (keywords === '') {
        setTitle(topPageTitle);
    } else {
        setTitle(keywords + ' | 番組検索');
    }
}
