import {
    TOP_URL,
    CDN_URL,
} from '../module/env/constant';
import {
    scrollToTop,
} from '../module/common';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import {
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
    replaceText,
    getBaseURL,
    getFullURL,
    createSVGElement,
    createInputElement,
    appendChildren,
    body,
    disableInput,
} from '../module/dom';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from '../module/infinite_scrolling';
import { getLocalTimeString } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import { redirect, setCustomPopStateHandler } from '../module/global';
import { changeColor, setOpacity } from '../module/style';
import { allResultsShown, loading, noResult } from '../module/text/ui';
import { addAutoMultiLanguageClass } from '../module/dom/create_element/multi_language';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/index.module.scss';
import { lineClamp as lineClampClass } from '../../css/line_clamp.module.scss';
import { CSS_COLOR } from '../module/style/value';
import { type Pivot, type SeriesInfo, parseSeriesInfo, SeriesInfoKey, SeriesEntryKey } from '../module/type/SeriesInfo';
import { MaintenanceInfoKey } from '../module/type/MaintenanceInfo';
import { attachLazyload, offload as offloadLazyload } from '../module/lazyload';
import { getURLKeywords, setSearch } from './shared';

let pivot: Pivot;
let keywords: string;
let currentRequest: XMLHttpRequest | null = null;

const eventTargetsTracker = new Set<EventTarget>();

export default function (seriesInfo: SeriesInfo, _keywords: string) {
    pivot = 0;
    keywords = _keywords;

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
    searchBarInput.value = keywords;

    appendChild(searchBar, searchBarIcon);
    appendChild(searchBar, searchBarInput);

    const disableSearchBarInput = (disabled: boolean) => {
        disableInput(searchBarInput, disabled);
        if (disabled) {
            addClass(searchBar, styles.disabled);
        } else {
            removeClass(searchBar, styles.disabled);
        }
    };

    const containerElem = createDivElement();
    addClass(containerElem, styles.container);
    const loadingTextContainer = createDivElement();
    addClass(loadingTextContainer, styles.loadingText);

    const positionDetector = createDivElement();
    const infiniteScrolling = initializeInfiniteScrolling(
        positionDetector,
        () => {
            getSeries((seriesInfo) => {
                showSeries(
                    seriesInfo,
                    containerElem,
                    loadingTextContainer,
                    infiniteScrolling,
                );
            });
        },
        - 256 - 24
    );

    appendChildren(body, searchBar, containerElem, loadingTextContainer, positionDetector);

    const maintenanceInfo = seriesInfo[SeriesInfoKey.MAINTENANCE];
    if (maintenanceInfo !== undefined) {
        const annoucementOuterContainer = createDivElement();
        const announcementInnerContainer = createDivElement();
        addClass(annoucementOuterContainer, styles.announcement);
        appendChild(annoucementOuterContainer, announcementInnerContainer);
        insertBefore(annoucementOuterContainer, containerElem);

        const announcementTitle = createParagraphElement('メンテナンスのお知らせ');
        addClass(announcementTitle, styles.announcementTitle);
        changeColor(announcementTitle, CSS_COLOR.ORANGE);
        appendChild(announcementInnerContainer, announcementTitle);

        let message = '';
        const maintenanceStart = maintenanceInfo[MaintenanceInfoKey.START];
        const maintenancePeriod = maintenanceInfo[MaintenanceInfoKey.PERIOD];
        const startTime = getLocalTimeString(maintenanceStart, false, false);
        if (maintenancePeriod > 0) {
            const endTime = getLocalTimeString(maintenanceStart + maintenancePeriod, false, false);
            message = `${startTime}～${endTime}の間、メンテナンスを実施する予定です。`;
        } else {
            message = `メンテナンス開始は${startTime}を予定しております。`;
        }
        message += 'ご不便をおかけして申し訳ありません。';
        const announcementBody = createParagraphElement(message);
        addClass(announcementBody, styles.announcementBody);
        appendChild(announcementInnerContainer, announcementBody);
    }
    showSeries(
        seriesInfo,
        containerElem,
        loadingTextContainer,
        infiniteScrolling,
    );
    const searchClosure = (useURLKeywords: boolean) => {
        search(
            useURLKeywords,
            searchBarInput,
            containerElem,
            loadingTextContainer,
            infiniteScrolling,
            disableSearchBarInput,
        );
    };
    setSearch(searchClosure);
    addEventListener(searchBarIcon, 'click', () => {
        if (!searchBarInput.disabled) {
            searchClosure(false);
        }
    });
    addEventListener(searchBarInput, 'keyup', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            searchClosure(false);
        }
    });
    const currentBaseURL = getBaseURL();
    setCustomPopStateHandler(() => {
        if (currentBaseURL !== getBaseURL()) {
            redirect(getFullURL(), null);
            return;
        }
        searchClosure(true);
    });
}

function showSeries(
    seriesInfo: SeriesInfo,
    containerElem: HTMLElement,
    loadingTextContainer: HTMLElement,
    infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>,
): void {
    const series = seriesInfo[SeriesInfoKey.SERIES];
    const newPivot = seriesInfo[SeriesInfoKey.PIVOT];

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
        const title = seriesEntry[SeriesEntryKey.TITLE];
        const seriesNode = createDivElement();
        const thumbnailNode = createDivElement();
        const overlay = createDivElement();
        const titleNode = createParagraphElement(title);

        appendChild(seriesNode, thumbnailNode);
        appendChild(seriesNode, overlay);
        appendChild(seriesNode, titleNode);

        addClass(overlay, styles.overlay);
        addClass(thumbnailNode, styles.thumbnail);
        addClass(titleNode, lineClampClass);

        addEventListener(seriesNode, 'click', () => { goToSeries(seriesEntry[SeriesEntryKey.ID]); });
        eventTargetsTracker.add(seriesNode);

        appendChild(containerElem, seriesNode);
        attachLazyload(thumbnailNode, CDN_URL + '/thumbnails/' + seriesEntry[SeriesEntryKey.THUMBNAIL], 'サムネイル：' + title);
    }

    infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](true);
    infiniteScrolling[InfiniteScrollingProp.UPDATE_POSITION]();
}

function search(
    useURLKeywords: boolean,
    searchBarInput: HTMLInputElement,
    containerElem: HTMLElement,
    loadingTextContainer: HTMLElement,
    infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>,
    disableSearchBarInput: (disabled: boolean) => void,
) {
    pivot = 0;
    disableSearchBarInput(true);
    infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](false);
    scrollToTop();

    if (useURLKeywords) {
        keywords = getURLKeywords();
        searchBarInput.value = keywords;
    } else {
        keywords = searchBarInput.value.substring(0, 50);
        if (keywords === '') {
            changeURL(TOP_URL);
        } else {
            changeURL(TOP_URL + '?' + 'keywords=' + encodeURIComponent(keywords));
        }
    }

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
            showSeries(
                seriesInfo,
                containerElem,
                loadingTextContainer,
                infiniteScrolling,
            );
            setOpacity(containerElem, 1);
            setOpacity(loadingTextContainer, 1);
            disableSearchBarInput(false);
        });
    });
}

function goToSeries(id: string) {
    redirect(TOP_URL + '/bangumi/' + id);
}

function getSeries(callback: (seriesInfo: SeriesInfo, xhr?: XMLHttpRequest) => void) {
    if (pivot === 'EOF') {
        return;
    }
    if (currentRequest !== null && currentRequest.readyState !== XMLHttpRequest.DONE) {
        currentRequest.abort();
    }
    const keywordsQuery = keywords === '' ? '' : 'keywords=' + encodeURIComponent(keywords) + '&';
    const request = sendServerRequest('get_series?' + keywordsQuery + 'pivot=' + pivot, {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (currentRequest !== request) {
                return;
            }
            callback(parseResponse(response, parseSeriesInfo), request);
        },
        [ServerRequestOptionProp.LOGOUT_PARAM]: keywordsQuery.slice(0, -1),
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
    currentRequest = request;
}

export function offload() {
    offloadLazyload();
    eventTargetsTracker.clear();
    currentRequest = null;
}
