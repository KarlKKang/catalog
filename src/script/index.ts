// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT,
    TOP_URL,
    CDN_URL,
} from './module/env/constant';
import {
    navListeners,
    sendServerRequest,
    getURLParam,
    clearCookies,
    disableInput,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    getById,
    getDescendantsByTagAt,
    getDescendantsByClassAt,
    removeClass,
    getBody,
    createElement,
    addClass,
    changeURL,
    appendChild,
    setDataAttribute,
    showElement,
    getBaseURL,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import * as SeriesInfo from './module/type/SeriesInfo';
import { default as importLazyload } from './module/lazyload';
import initializeInfiniteScrolling from './module/infinite_scrolling';
import isbot from 'isbot';

let lazyloadInitialize: () => void;

let searchBar: HTMLElement;
let searchBarInput: HTMLInputElement;
let containerElem: HTMLElement;

let pivot: SeriesInfo.PivotInfo = 0;
let keywords = '';

let lazyloadImportPromise: ReturnType<typeof importLazyload>;
let infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;

addEventListener(w, 'load', function () {
    if (getBaseURL() !== TOP_URL && !DEVELOPMENT) {
        redirect(TOP_URL, true);
        return;
    }

    clearCookies();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    // Preload module
    lazyloadImportPromise = importLazyload();

    searchBar = getById('search-bar');
    searchBarInput = getDescendantsByTagAt(searchBar, 'input', 0) as HTMLInputElement;

    containerElem = getById('container');

    getURLKeywords();
    getSeries(function (seriesInfo: SeriesInfo.SeriesInfo) {
        lazyloadImportPromise.then((module) => {
            lazyloadInitialize = module;
            infiniteScrolling = initializeInfiniteScrolling(getSeries, - 256 - 24);
            addClass(getBody(), 'invisible'); // Infinite scrolling does not work when element 'display' property is set to 'none'.
            showElement(getBody());
            showSeries(seriesInfo);
            navListeners();
            addEventListener(getDescendantsByClassAt(searchBar, 'icon', 0), 'click', function () {
                if (!searchBarInput.disabled) {
                    search();
                }
            });
            addEventListener(searchBarInput, 'keyup', function (event) {
                if ((event as KeyboardEvent).key === 'Enter') {
                    search();
                }
            });
            removeClass(getBody(), 'invisible');
        });
    });
});

function showSeries(seriesInfo: SeriesInfo.SeriesInfo): void {
    pivot = seriesInfo[seriesInfo.length - 1] as SeriesInfo.PivotInfo;
    const SeriesEntries = seriesInfo.slice(0, -1) as SeriesInfo.SeriesEntries;
    for (const seriesEntry of SeriesEntries) {
        const seriesNode = createElement('div');
        const thumbnailNode = createElement('div');
        const overlay = createElement('div');
        const titleNode = createElement('p');

        appendChild(seriesNode, thumbnailNode);
        appendChild(seriesNode, titleNode);

        addClass(overlay, 'overlay');
        appendChild(thumbnailNode, overlay);
        addClass(thumbnailNode, 'lazyload');
        setDataAttribute(thumbnailNode, 'src', CDN_URL + '/thumbnails/' + seriesEntry.thumbnail);
        setDataAttribute(thumbnailNode, 'alt', 'サムネイル：' + seriesEntry.title);
        titleNode.innerHTML = seriesEntry.title;
        addClass(titleNode, 'ellipsis-clipping-2');

        addEventListener(seriesNode, 'click', function () { goToSeries(seriesEntry.id); });
        addClass(seriesNode, 'series');

        appendChild(containerElem, seriesNode);
    }

    lazyloadInitialize();

    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

function goToSeries(id: string) {
    let url;
    if (DEVELOPMENT) {
        url = 'bangumi.html' + '?series=' + id;
    } else {
        url = TOP_URL + '/bangumi/' + id;
    }
    redirect(url);
}

function search() {
    disableSearchBarInput(true);
    infiniteScrolling.setEnabled(false);

    const searchBarInputValue = searchBarInput.value.substring(0, 50);

    if (searchBarInputValue == '') {
        keywords = '';
        changeURL(TOP_URL);
    } else {
        keywords = 'keywords=' + encodeURIComponent(searchBarInputValue);
        changeURL(TOP_URL + '?' + keywords);
        keywords += '&';
    }
    requestSearchResults();
}

addEventListener(w, 'popstate', function () {
    infiniteScrolling.setEnabled(false);
    getURLKeywords();
    requestSearchResults();
});

function getURLKeywords() {
    const urlParam = getURLParam('keywords');
    if (urlParam == null) {
        keywords = '';
        searchBarInput.value = '';
    } else {
        keywords = decodeURIComponent(urlParam).substring(0, 50);
        searchBarInput.value = keywords;
        keywords = 'keywords=' + encodeURIComponent(keywords) + '&';
    }
}

function getSeries(callback?: (seriesInfo: SeriesInfo.SeriesInfo) => void) {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest('get_series.php', {
        callback: function (response: string) {
            let parsedResponse: SeriesInfo.SeriesInfo;
            try {
                parsedResponse = JSON.parse(response);
                SeriesInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }

            if (callback === undefined) {
                showSeries(parsedResponse);
            } else {
                callback(parsedResponse);
            }
        },
        content: keywords + 'pivot=' + pivot,
        logoutParam: keywords.slice(0, -1)
    });
}

function requestSearchResults() {
    pivot = 0;

    getSeries(function (seriesInfo: SeriesInfo.SeriesInfo) {
        addClass(containerElem, 'transparent');
        setTimeout(function () {
            containerElem.innerHTML = '';
            showSeries(seriesInfo);
            removeClass(containerElem, 'transparent');
            disableSearchBarInput(false);
        }, 400);
    });
}

function disableSearchBarInput(disabled: boolean) {
    disableInput(searchBarInput, disabled);
    if (disabled) {
        addClass(searchBar, 'disabled');
    } else {
        removeClass(searchBar, 'disabled');
    }
}