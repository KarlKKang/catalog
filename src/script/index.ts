// JavaScript Document
import "core-js";
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
    cssVarWrapper,
    disableInput,
    checkBaseURL,
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
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { SeriesInfo } from './module/type';
import { default as importLazyload } from './module/lazyload';
import initializeInfiniteScrolling from './module/infinite_scrolling';

var lazyloadInitialize: () => void;

var searchBar: HTMLElement;
var searchBarInput: HTMLInputElement;
var containerElem: HTMLElement;

var offset: SeriesInfo.OffsetInfo = 0;

var keywords = '';
var pivot = '';

var lazyloadImportPromise: ReturnType<typeof importLazyload>;
var infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;

addEventListener(w, 'load', function () {
    if (!checkBaseURL(TOP_URL) && !DEVELOPMENT) {
        redirect(TOP_URL, true);
        return;
    }

    cssVarWrapper();
    clearCookies();

    // Preload module
    lazyloadImportPromise = importLazyload();

    searchBar = getById('search-bar');
    searchBarInput = getDescendantsByTagAt(searchBar, 'input', 0) as HTMLInputElement;

    containerElem = getById('container');

    getURLKeywords();
    getSeries(function (seriesInfo: SeriesInfo.SeriesInfo) {
        lazyloadImportPromise.then((module) => {
            lazyloadInitialize = module;
            infiniteScrolling = initializeInfiniteScrolling(getSeries);
            showSeries(seriesInfo);
            navListeners();
            addEventListener(getDescendantsByClassAt(searchBar, 'icon', 0), 'click', function () {
                if (!searchBarInput.disabled) {
                    search();
                }
            });
            addEventListener(searchBarInput, 'keyup', function (event) {
                if ((event as KeyboardEvent).key === "Enter") {
                    search();
                }
            });
            removeClass(getBody(), "hidden");
        });
    });
});

function showSeries(seriesInfo: SeriesInfo.SeriesInfo) {
    var seriesEntries = seriesInfo.slice(0, -1) as SeriesInfo.SeriesEntries;
    for (let seriesEntry of seriesEntries) {
        let seriesNode = createElement('div');
        let thumbnailNode = createElement('div');
        let overlay = createElement('div');
        let titleNode = createElement('p');

        appendChild(seriesNode, thumbnailNode);
        appendChild(seriesNode, titleNode);

        addClass(overlay, 'overlay');
        appendChild(thumbnailNode, overlay);
        addClass(thumbnailNode, 'lazyload');
        thumbnailNode.dataset.src = CDN_URL + '/thumbnails/' + seriesEntry.thumbnail;
        thumbnailNode.dataset.alt = 'サムネイル：' + seriesEntry.title;
        titleNode.innerHTML = seriesEntry.title;
        addClass(titleNode, 'ellipsis-clipping-2');

        addEventListener(seriesNode, 'click', function () { goToSeries(seriesEntry.id); });
        addClass(seriesNode, 'series')

        appendChild(containerElem, seriesNode);
    }

    offset = seriesInfo[seriesInfo.length - 1] as SeriesInfo.OffsetInfo;

    if (offset != 'EOF' && keywords != '') {
        pivot = 'pivot=' + seriesEntries[seriesEntries.length - 1]!.id + '&';
    } else {
        pivot = '';
    }

    lazyloadInitialize();

    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

function goToSeries(id: string) {
    var url;
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

    var searchBarInputValue = searchBarInput.value.substring(0, 50);

    if (searchBarInputValue == '') {
        keywords = "";
        changeURL(TOP_URL);
    } else {
        keywords = "keywords=" + encodeURIComponent(searchBarInputValue);
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
    var urlParam = getURLParam('keywords');
    if (urlParam == null) {
        keywords = "";
        searchBarInput.value = '';
    } else {
        keywords = decodeURIComponent(urlParam).substring(0, 50);
        searchBarInput.value = keywords;
        keywords = "keywords=" + encodeURIComponent(keywords) + "&";
    }
}

function getSeries(callback?: (seriesInfo: SeriesInfo.SeriesInfo) => void) {
    if (offset === 'EOF') {
        return;
    }

    sendServerRequest('get_series.php', {
        callback: function (response: string) {
            var parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                SeriesInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }

            if (callback === undefined) {
                showSeries(parsedResponse as SeriesInfo.SeriesInfo);
            } else {
                callback(parsedResponse as SeriesInfo.SeriesInfo);
            }
        },
        content: keywords + pivot + "offset=" + offset,
        logoutParam: keywords.slice(0, -1)
    });
}

function requestSearchResults() {
    offset = 0;
    pivot = '';

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