import {
    TOP_URL,
    CDN_URL,
} from './module/env/constant';
import {
    addNavBar,
    sendServerRequest,
    getURLParam,
    disableInput,
    changeColor,
    scrollToTop,
    NAV_BAR_HOME,
} from './module/common';
import {
    w,
    addEventListener,
    getById,
    getDescendantsByTagAt,
    getDescendantsByClassAt,
    removeClass,
    addClass,
    changeURL,
    appendChild,
    insertBefore,
    createDivElement,
    createParagraphElement,
    appendText,
    replaceChildren,
    removeAllEventListeners,
    clearSessionStorage,
    replaceText,
    getBaseURL,
    getFullURL,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import * as SeriesInfo from './module/type/SeriesInfo';
import { getInfiniteScrolling, initializeInfiniteScrolling, destroy as destroyInfiniteScrolling } from './module/infinite_scrolling';
import { isbot } from 'isbot';
import { getLocalTimeString } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { addTimeout } from './module/timer';
import { allResultsShown, loading, noResult } from './module/message/template/inline';
import { redirect, setCustomPopStateHandler } from './module/global';
import { lazyloadImport, unloadLazyload } from './module/lazyload';

let pivot: SeriesInfo.Pivot;
let keywords: string;
let currentRequest: XMLHttpRequest | null = null;

const eventTargetsTracker = new Set<EventTarget>();

export default function (showPage: ShowPageFunc) {
    pivot = 0;
    keywords = '';

    clearSessionStorage();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    // Preload module
    const lazyloadImportPromise = lazyloadImport();

    const urlKeywords = getURLKeywords();
    if (urlKeywords !== '') {
        keywords = 'keywords=' + encodeURIComponent(urlKeywords) + '&';
    }

    getSeries((seriesInfo, xhr) => {
        showPage(async () => {
            const lazyload = await lazyloadImportPromise;
            if (currentRequest !== xhr) {
                return;
            }
            showPageCallback(seriesInfo, urlKeywords, lazyload);
        });
    }, false);
}

function showPageCallback(
    seriesInfo: SeriesInfo.SeriesInfo,
    urlKeywords: string,
    lazyload: Awaited<ReturnType<typeof lazyloadImport>>,
) {
    const searchBar = getById('search-bar');
    const searchBarInput = getDescendantsByTagAt(searchBar, 'input', 0) as HTMLInputElement;
    searchBarInput.value = urlKeywords;
    const containerElem = getById('container');
    const loadingTextContainer = getById('loading-text');
    const currentBaseURL = getBaseURL();

    initializeInfiniteScrolling(() => { getSeries(showSeries, true); }, - 256 - 24);
    if (seriesInfo.maintenance !== undefined) {
        const annoucementOuterContainer = createDivElement();
        const announcementInnerContainer = createDivElement();
        addClass(annoucementOuterContainer, 'announcement');
        appendChild(annoucementOuterContainer, announcementInnerContainer);
        insertBefore(annoucementOuterContainer, containerElem);

        const announcementTitle = createParagraphElement();
        addClass(announcementTitle, 'announcement-title');
        changeColor(announcementTitle, 'orange');
        appendText(announcementTitle, 'メンテナンスのお知らせ');
        const announcementBody = createParagraphElement();
        addClass(announcementBody, 'announcement-body');
        appendChild(announcementInnerContainer, announcementTitle);
        appendChild(announcementInnerContainer, announcementBody);

        const maintenanceInfo = seriesInfo.maintenance;
        let message = '';
        const startTime = getLocalTimeString(maintenanceInfo.start, false, false);
        if (maintenanceInfo.period > 0) {
            const endTime = getLocalTimeString(maintenanceInfo.start + maintenanceInfo.period, false, false);
            message = `${startTime}～${endTime}の間、メンテナンスを実施する予定です。`;
        } else {
            message = `メンテナンス開始は${startTime}を予定しております。`;
        }
        message += 'ご不便をおかけして申し訳ありません。';
        appendText(announcementBody, message);
    }
    showSeries(seriesInfo);
    addNavBar(NAV_BAR_HOME, () => {
        if (w.scrollY !== 0) {
            scrollToTop();
            return;
        }
        if (keywords === '') {
            redirect(TOP_URL);
            return;
        }
        searchBarInput.value = '';
        search();
    });
    addEventListener(getDescendantsByClassAt(searchBar, 'icon', 0), 'click', () => {
        if (!searchBarInput.disabled) {
            search();
        }
    });
    addEventListener(searchBarInput, 'keyup', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            search();
        }
    });
    setCustomPopStateHandler(() => {
        if (currentBaseURL !== getBaseURL()) {
            redirect(getFullURL(), null);
            return;
        }
        const urlKeywords = getURLKeywords();
        searchBarInput.value = urlKeywords;
        if (urlKeywords === '') {
            keywords = '';
        } else {
            keywords = 'keywords=' + encodeURIComponent(urlKeywords) + '&';
        }
        requestSearchResults();
    });

    function showSeries(seriesInfo: SeriesInfo.SeriesInfo): void {
        const series = seriesInfo.series;
        const newPivot = seriesInfo.pivot;

        if (pivot === 0 && series.length === 0) {
            addClass(containerElem, 'empty');
            replaceText(loadingTextContainer, noResult);
        } else {
            removeClass(containerElem, 'empty');
            if (newPivot === 'EOF') {
                replaceText(loadingTextContainer, allResultsShown);
            } else {
                replaceText(loadingTextContainer, loading);
            }
        }

        pivot = newPivot;
        for (const seriesEntry of series) {
            const seriesNode = createDivElement();
            const thumbnailNode = createDivElement();
            const overlay = createDivElement();
            const titleNode = createParagraphElement();

            appendChild(seriesNode, thumbnailNode);
            appendChild(seriesNode, titleNode);

            addClass(overlay, 'overlay');
            appendChild(thumbnailNode, overlay);
            addClass(thumbnailNode, 'lazyload');
            appendText(titleNode, seriesEntry.title);
            addClass(titleNode, 'ellipsis-clipping-2');

            addEventListener(seriesNode, 'click', () => { goToSeries(seriesEntry.id); });
            eventTargetsTracker.add(seriesNode);
            addClass(seriesNode, 'series');

            appendChild(containerElem, seriesNode);
            lazyload.default(thumbnailNode, CDN_URL + '/thumbnails/' + seriesEntry.thumbnail, 'サムネイル：' + seriesEntry.title);
        }

        const infiniteScrolling = getInfiniteScrolling();
        infiniteScrolling.setEnabled(true);
        infiniteScrolling.updatePosition();
    }

    function search() {
        const searchBarInputValue = searchBarInput.value.substring(0, 50);

        if (searchBarInputValue === '') {
            keywords = '';
            changeURL(TOP_URL);
        } else {
            keywords = 'keywords=' + encodeURIComponent(searchBarInputValue);
            changeURL(TOP_URL + '?' + keywords);
            keywords += '&';
        }
        requestSearchResults();
    }

    function requestSearchResults() {
        pivot = 0;
        disableSearchBarInput(true);
        getInfiniteScrolling().setEnabled(false);
        scrollToTop();

        addClass(containerElem, 'transparent');
        addClass(loadingTextContainer, 'transparent');
        const animationTimeout = new Promise<void>((resolve) => {
            addTimeout(() => {
                for (const eventTarget of eventTargetsTracker) {
                    removeAllEventListeners(eventTarget);
                }
                eventTargetsTracker.clear();
                lazyload.unobserveAll();
                replaceChildren(containerElem);
                resolve();
            }, 400);
        });

        getSeries((seriesInfo, xhr) => {
            animationTimeout.then(() => {
                if (currentRequest !== xhr) {
                    return;
                }
                showSeries(seriesInfo);
                removeClass(containerElem, 'transparent');
                removeClass(loadingTextContainer, 'transparent');
                disableSearchBarInput(false);
            });
        }, true);
    }

    function disableSearchBarInput(disabled: boolean) {
        disableInput(searchBarInput, disabled);
        if (disabled) {
            addClass(searchBar, 'disabled');
        } else {
            removeClass(searchBar, 'disabled');
        }
    }
}

function goToSeries(id: string) {
    redirect(TOP_URL + '/bangumi/' + id);
}

function getURLKeywords() {
    const urlParam = getURLParam('keywords');
    if (urlParam === null) {
        return '';
    } else {
        return decodeURIComponent(urlParam).substring(0, 50);
    }
}

function getSeries(callback: (seriesInfo: SeriesInfo.SeriesInfo, xhr?: XMLHttpRequest) => void, showSessionEndedMessage: boolean) {
    if (pivot === 'EOF') {
        return;
    }
    if (currentRequest !== null && currentRequest.readyState !== XMLHttpRequest.DONE) {
        currentRequest.abort();
    }
    const request = sendServerRequest('get_series?' + keywords + 'pivot=' + pivot, {
        callback: function (response: string) {
            if (currentRequest !== request) {
                return;
            }
            let parsedResponse: SeriesInfo.SeriesInfo;
            try {
                parsedResponse = JSON.parse(response);
                SeriesInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }
            callback(parsedResponse, request);
        },
        logoutParam: keywords.slice(0, -1),
        showSessionEndedMessage: showSessionEndedMessage,
        method: 'GET',
    });
    currentRequest = request;
}

export function offload() {
    unloadLazyload();
    destroyInfiniteScrolling();
    eventTargetsTracker.clear();
    currentRequest = null;
}
