// JavaScript Document
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
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { moduleImportError } from './module/message/template/param';
import * as SeriesInfo from './module/type/SeriesInfo';
import { getInfiniteScrolling, initializeInfiniteScrolling, destroy as destroyInfiniteScrolling } from './module/infinite_scrolling';
import isbot from 'isbot';
import { getLocalTime } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

let pageLoaded: boolean;

let pivot: SeriesInfo.Pivot;
let keywords: string;

let redirect: RedirectFunc;

type Lazyload = typeof import(
    /* webpackExports: ["default", "unobserveAll"] */
    './module/lazyload'
);
let lazyload: Lazyload | null = null;

type ImageLoader = typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    './module/image_loader'
);
let imageLoader: ImageLoader | null = null;

const eventTargetsTracker = new Set<EventTarget>();

export default function (showPage: ShowPageFunc, _redirect: RedirectFunc) {
    pageLoaded = true;
    pivot = 0;
    keywords = '';
    redirect = _redirect;

    clearSessionStorage();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    // Preload module
    const lazyloadImportPromise = import(
        /* webpackExports: ["default", "unobserveAll"] */
        './module/lazyload'
    );

    const imageLoaderImportPromise = import(
        /* webpackExports: ["clearAllImageEvents"] */
        './module/image_loader'
    );

    const urlKeywords = getURLKeywords();
    if (urlKeywords !== '') {
        keywords = 'keywords=' + encodeURIComponent(urlKeywords) + '&';
    }

    getSeries(async (seriesInfo: SeriesInfo.SeriesInfo) => {
        let lazyloadModule: Lazyload;
        let imageLoaderModule: ImageLoader;
        try {
            lazyload = await lazyloadImportPromise;
            lazyloadModule = lazyload;
            imageLoader = await imageLoaderImportPromise;
            imageLoaderModule = imageLoader;
        } catch (e) {
            showMessage(redirect, moduleImportError(e));
            throw e;
        }

        showPage(() => { showPageCallback(seriesInfo, urlKeywords, lazyloadModule, imageLoaderModule); });
    }, false);
}

function showPageCallback(
    seriesInfo: SeriesInfo.SeriesInfo,
    urlKeywords: string,
    lazyloadModule: Lazyload,
    imageLoaderModule: ImageLoader
) {
    const searchBar = getById('search-bar');
    const searchBarInput = getDescendantsByTagAt(searchBar, 'input', 0) as HTMLInputElement;
    const containerElem = getById('container');
    searchBarInput.value = urlKeywords;

    initializeInfiniteScrolling(() => { getSeries(showSeries, true); }, - 256 - 24);
    if (seriesInfo.maintenance !== undefined) {
        const annoucementContainer = createDivElement();
        addClass(annoucementContainer, 'announcement');
        const announcementTitle = createParagraphElement();
        addClass(announcementTitle, 'announcement-title');
        changeColor(announcementTitle, 'orange');
        const announcementBody = createParagraphElement();
        addClass(announcementBody, 'announcement-body');
        appendChild(annoucementContainer, announcementTitle);
        appendChild(annoucementContainer, announcementBody);
        insertBefore(annoucementContainer, containerElem);
        appendText(announcementTitle, 'メンテナンスのお知らせ');

        const maintenanceInfo = seriesInfo.maintenance;
        let message = '';
        const startTime = getLocalTime(maintenanceInfo.start);
        if (maintenanceInfo.period > 0) {
            const endTime = getLocalTime(maintenanceInfo.start + maintenanceInfo.period);
            message = `${startTime.year}年${startTime.month}月${startTime.date}日（${startTime.dayOfWeek}）${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}～${endTime.year}年${endTime.month}月${endTime.date}日（${endTime.dayOfWeek}）${endTime.hour.toString().padStart(2, '0')}:${endTime.minute.toString().padStart(2, '0')}の間、メンテナンスを実施する予定です。`;
        } else {
            message = `メンテナンス開始は${startTime.year}年${startTime.month}月${startTime.date}日（${startTime.dayOfWeek}）${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}を予定しております。`;
        }
        message += 'ご不便をおかけして申し訳ありません。';
        appendText(announcementBody, message);
    }
    showSeries(seriesInfo);
    addNavBar(redirect, NavBarPage.HOME, () => {
        scrollToTop();
        if (keywords !== '') {
            searchBarInput.value = '';
            search();
        }
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
    addEventListener(w, 'popstate', () => {
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
        pivot = seriesInfo.pivot;
        for (const seriesEntry of seriesInfo.series) {
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
            lazyloadModule.default(thumbnailNode, CDN_URL + '/thumbnails/' + seriesEntry.thumbnail, 'サムネイル：' + seriesEntry.title, redirect);
        }

        const infiniteScrolling = getInfiniteScrolling();
        infiniteScrolling.setEnabled(true);
        infiniteScrolling.updatePosition();
    }

    function search() {
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

    function requestSearchResults() {
        pivot = 0;
        disableSearchBarInput(true);
        getInfiniteScrolling().setEnabled(false);

        addClass(containerElem, 'transparent');
        const animationTimeout = new Promise<void>((resolve) => {
            setTimeout(() => { // Using `addTimeout` may result in a promise that will never be settled.
                for (const eventTarget of eventTargetsTracker) {
                    removeAllEventListeners(eventTarget);
                }
                eventTargetsTracker.clear();
                lazyloadModule.unobserveAll();
                imageLoaderModule.clearAllImageEvents();
                resolve();
            }, 400);
        });

        getSeries((seriesInfo: SeriesInfo.SeriesInfo) => {
            animationTimeout.then(() => {
                if (!pageLoaded) {
                    return;
                }
                replaceChildren(containerElem);
                showSeries(seriesInfo);
                removeClass(containerElem, 'transparent');
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
    if (urlParam == null) {
        return '';
    } else {
        return decodeURIComponent(urlParam).substring(0, 50);
    }
}

function getSeries(callback: (seriesInfo: SeriesInfo.SeriesInfo) => void, showSessionEndedMessage: boolean) {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest(redirect, 'get_series', {
        callback: function (response: string) {
            let parsedResponse: SeriesInfo.SeriesInfo;
            try {
                parsedResponse = JSON.parse(response);
                SeriesInfo.check(parsedResponse);
            } catch (e) {
                showMessage(redirect, invalidResponse);
                return;
            }
            callback(parsedResponse);
        },
        content: keywords + 'pivot=' + pivot,
        logoutParam: keywords.slice(0, -1),
        showSessionEndedMessage: showSessionEndedMessage,
    });
}

export function offload() {
    lazyload?.unobserveAll();
    lazyload = null;
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
    destroyInfiniteScrolling();
    eventTargetsTracker.clear();
    pageLoaded = false;
}
