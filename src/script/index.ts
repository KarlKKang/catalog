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
    addClass,
    changeURL,
    appendChild,
    showElement,
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
import type { default as LazyloadObserve } from './module/lazyload';
import initializeInfiniteScrolling from './module/infinite_scrolling';
import isbot from 'isbot';
import { getLocalTime } from './module/main/pure';

let searchBar: HTMLElement;
let searchBarInput: HTMLInputElement;
let containerElem: HTMLElement;

let pivot: SeriesInfo.Pivot = 0;
let keywords = '';

let lazyloadObserve: typeof LazyloadObserve;
let lazyloadUnobserveAll: () => void;
let clearAllImageEvents: () => void;
let infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;

const eventTargetsTracker = new Set<EventTarget>();

export default function () {
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

    searchBar = getById('search-bar');
    searchBarInput = getDescendantsByTagAt(searchBar, 'input', 0) as HTMLInputElement;

    containerElem = getById('container');

    getURLKeywords();
    getSeries(async (seriesInfo: SeriesInfo.SeriesInfo) => {
        try {
            const lazyloadModule = await lazyloadImportPromise;
            lazyloadObserve = lazyloadModule.default;
            lazyloadUnobserveAll = lazyloadModule.unobserveAll;

            const imageLoaderModule = await imageLoaderImportPromise;
            clearAllImageEvents = imageLoaderModule.clearAllImageEvents;
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }

        infiniteScrolling = initializeInfiniteScrolling(getSeries, - 256 - 24);
        addClass(getBody(), 'invisible'); // Infinite scrolling does not work when element 'display' property is set to 'none'.
        showElement(getBody());
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
        addNavBar('home', () => {
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
            getURLKeywords();
            requestSearchResults();
        });
        removeClass(getBody(), 'invisible');
    });
}

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
        lazyloadObserve(thumbnailNode, CDN_URL + '/thumbnails/' + seriesEntry.thumbnail, 'サムネイル：' + seriesEntry.title);
    }

    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

function goToSeries(id: string) {
    redirect(TOP_URL + '/bangumi/' + id);
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

function getURLKeywords() {
    const urlParam = getURLParam('keywords');
    if (urlParam == null) {
        keywords = '';
        searchBarInput.value = '';
    } else {
        keywords = decodeURIComponent(urlParam).substring(0, 50);
        if (keywords === '') {
            keywords = '';
            searchBarInput.value = '';
        } else {
            searchBarInput.value = keywords;
            keywords = 'keywords=' + encodeURIComponent(keywords) + '&';
        }
    }
}

function getSeries(callback?: (seriesInfo: SeriesInfo.SeriesInfo) => void) {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest('get_series', {
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
    disableSearchBarInput(true);
    infiniteScrolling.setEnabled(false);

    addClass(containerElem, 'transparent');
    const animationTimeout = new Promise<void>((resolve) => {
        setTimeout(() => {
            for (const eventTarget of eventTargetsTracker) {
                removeAllEventListeners(eventTarget);
            }
            eventTargetsTracker.clear();
            lazyloadUnobserveAll();
            clearAllImageEvents();
            resolve();
        }, 400);
    });

    getSeries((seriesInfo: SeriesInfo.SeriesInfo) => {
        animationTimeout.then(() => {
            replaceChildren(containerElem);
            showSeries(seriesInfo);
            removeClass(containerElem, 'transparent');
            disableSearchBarInput(false);
        });
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