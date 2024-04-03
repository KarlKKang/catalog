import {
    TOP_URL,
    CDN_URL,
} from './module/env/constant';
import {
    getURLParam,
    scrollToTop,
} from './module/common';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { ServerRequestOptionProp, sendServerRequest } from './module/server';
import {
    w,
    addEventListener,
    removeClass,
    addClass,
    changeURL,
    appendChild,
    insertBefore,
    createDivElement,
    createParagraphElement,
    replaceChildren,
    removeAllEventListeners,
    clearSessionStorage,
    replaceText,
    getBaseURL,
    getFullURL,
    createSVGElement,
    createInputElement,
    appendChildren,
    body,
    disableInput,
} from './module/dom';
import { showMessage } from './module/message';
import { invalidResponse } from './module/server/message';
import * as SeriesInfo from './module/type/SeriesInfo';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from './module/infinite_scrolling';
import { isbot } from 'isbot';
import { getLocalTimeString } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { addTimeout } from './module/timer';
import { redirect, setCustomPopStateHandler } from './module/global';
import { LazyloadProp, importLazyload, offloadLazyload } from './module/lazyload';
import { changeColor, setOpacity } from './module/style';
import { allResultsShown, loading, noResult } from './module/text/ui';
import { addAutoMultiLanguageClass } from './module/dom/create_element/multi_language';
import * as commonStyles from '../css/common.module.scss';
import * as styles from '../css/index.module.scss';
import { lineClamp as lineClampClass } from '../css/line_clamp.module.scss';
import { CSS_COLOR } from './module/style/value';

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

    const urlKeywords = getURLKeywords();
    if (urlKeywords !== '') {
        keywords = 'keywords=' + encodeURIComponent(urlKeywords) + '&';
    }

    const searchBar = createDivElement();
    addClass(searchBar, styles.searchBar, commonStyles.inputField);

    const searchBarIcon = createDivElement();
    addClass(searchBarIcon, styles.icon);
    appendChild(searchBarIcon, createSVGElement('0 0 24 24', 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'));

    const searchBarInput = createInputElement('text');
    addAutoMultiLanguageClass(searchBarInput);
    searchBarInput.maxLength = 50;
    searchBarInput.autocapitalize = 'off';
    searchBarInput.autocomplete = 'off';
    searchBarInput.spellcheck = false;
    searchBarInput.value = urlKeywords;

    appendChild(searchBar, searchBarIcon);
    appendChild(searchBar, searchBarInput);

    const containerElem = createDivElement();
    addClass(containerElem, styles.container);
    const loadingTextContainer = createDivElement();
    addClass(loadingTextContainer, styles.loadingText);

    const positionDetector = createDivElement();
    const infiniteScrolling = initializeInfiniteScrolling(positionDetector, () => { getSeries(showSeries, true); }, - 256 - 24);

    addNavBar(NavBarPage.HOME, () => {
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
    const lazyloadImportPromise = importLazyload();
    let lazyload: Awaited<typeof lazyloadImportPromise>;
    getSeries(async (seriesInfo, xhr) => {
        lazyload = await lazyloadImportPromise;
        if (currentRequest !== xhr) {
            return;
        }
        showPage();
        showPageCallback(seriesInfo);
    }, false);

    function showPageCallback(seriesInfo: SeriesInfo.SeriesInfo) {
        appendChildren(body, searchBar, containerElem, loadingTextContainer, positionDetector);
        if (seriesInfo.maintenance !== undefined) {
            const annoucementOuterContainer = createDivElement();
            const announcementInnerContainer = createDivElement();
            addClass(annoucementOuterContainer, styles.announcement);
            appendChild(annoucementOuterContainer, announcementInnerContainer);
            insertBefore(annoucementOuterContainer, containerElem);

            const announcementTitle = createParagraphElement('メンテナンスのお知らせ');
            addClass(announcementTitle, styles.announcementTitle);
            changeColor(announcementTitle, CSS_COLOR.ORANGE);
            appendChild(announcementInnerContainer, announcementTitle);

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
            const announcementBody = createParagraphElement(message);
            addClass(announcementBody, styles.announcementBody);
            appendChild(announcementInnerContainer, announcementBody);
        }
        showSeries(seriesInfo);
        addEventListener(searchBarIcon, 'click', () => {
            if (!searchBarInput.disabled) {
                search();
            }
        });
        addEventListener(searchBarInput, 'keyup', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                search();
            }
        });
        const currentBaseURL = getBaseURL();
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
    }

    function showSeries(seriesInfo: SeriesInfo.SeriesInfo): void {
        const series = seriesInfo.series;
        const newPivot = seriesInfo.pivot;

        if (pivot === 0 && series.length === 0) {
            addClass(containerElem, styles.empty);
            replaceText(loadingTextContainer, noResult);
        } else {
            removeClass(containerElem, styles.empty);
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
            const titleNode = createParagraphElement(seriesEntry.title);

            appendChild(seriesNode, thumbnailNode);
            appendChild(seriesNode, overlay);
            appendChild(seriesNode, titleNode);

            addClass(overlay, styles.overlay);
            addClass(thumbnailNode, styles.thumbnail);
            addClass(titleNode, lineClampClass);

            addEventListener(seriesNode, 'click', () => { goToSeries(seriesEntry.id); });
            eventTargetsTracker.add(seriesNode);

            appendChild(containerElem, seriesNode);
            lazyload[LazyloadProp.DEFAULT](thumbnailNode, CDN_URL + '/thumbnails/' + seriesEntry.thumbnail, 'サムネイル：' + seriesEntry.title);
        }

        infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](true);
        infiniteScrolling[InfiniteScrollingProp.UPDATE_POSITION]();
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
        infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](false);
        scrollToTop();

        setOpacity(containerElem, 0);
        setOpacity(loadingTextContainer, 0);
        const animationTimeout = new Promise<void>((resolve) => {
            addTimeout(() => {
                for (const eventTarget of eventTargetsTracker) {
                    removeAllEventListeners(eventTarget);
                }
                eventTargetsTracker.clear();
                offloadLazyload();
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
                setOpacity(containerElem, 1);
                setOpacity(loadingTextContainer, 1);
                disableSearchBarInput(false);
            });
        }, true);
    }

    function disableSearchBarInput(disabled: boolean) {
        disableInput(searchBarInput, disabled);
        if (disabled) {
            addClass(searchBar, styles.disabled);
        } else {
            removeClass(searchBar, styles.disabled);
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
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
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
        [ServerRequestOptionProp.LOGOUT_PARAM]: keywords.slice(0, -1),
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: showSessionEndedMessage,
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
    currentRequest = request;
}

export function offload() {
    offloadLazyload();
    eventTargetsTracker.clear();
    currentRequest = null;
}
