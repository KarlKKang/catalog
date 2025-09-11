import { newXhr } from '../module/xhr/new';
import { scrollToTop } from '../module/dom/scroll/to_top';
import { type APIRequest, APIRequestKey, APIRequestOptionKey, sendAPIRequest } from '../module/api/request';
import { parseResponse } from '../module/api/parse_response';
import { replaceText } from '../module/dom/element/text/replace';
import { createTextNode } from '../module/dom/element/text/create';
import { createSVGElement } from '../module/dom/element/svg/create';
import { createInputElement } from '../module/dom/element/input/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { insertBefore } from '../module/dom/node/insert_before';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { appendChildren } from '../module/dom/node/append_children';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { body } from '../module/dom/body';
import { getURI } from '../module/dom/location/get/uri';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';
import { addEventListener } from '../module/event_listener/add';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from '../module/infinite_scrolling';
import { toLocalTimeString } from '../module/string/local_time';
import { joinHttpForms } from '../module/string/http_form/join';
import { buildHttpForm } from '../module/string/http_form/build';
import { addTimeout } from '../module/timer/add/timeout';
import { addOffloadCallback } from '../module/global/offload';
import { setCustomPopStateHandler } from '../module/global/pop_state/custom_handler';
import { redirectSameOrigin } from '../module/global/redirect';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { setOpacity } from '../module/style/opacity';
import { noResult } from '../module/text/search/no_result';
import { allResultsShown } from '../module/text/search/all_results_shown';
import { loading } from '../module/text/search/loading';
import { addAutoMultiLanguageClass } from '../module/style/multi_language/auto';
import { inputField as inputFieldClass } from '../../css/button-input_field.module.scss';
import { link as linkClass } from '../../css/link.module.scss';
import * as styles from '../../css/index.module.scss';
import { lineClamp as lineClampClass } from '../../css/line_clamp.module.scss';
import { type Pivot, type SeriesInfo, parseSeriesInfo, SeriesInfoKey, SeriesEntryKey } from '../module/type/SeriesInfo';
import { MaintenanceInfoKey } from '../module/type/MaintenanceInfo';
import { attachLazyload, offload as offloadLazyload } from '../module/lazyload';
import { getURLKeywords, setSearch, setURLKeywords } from './shared';
import { getAPIOrigin } from '../module/env/location/get/origin/api';
import { getMediaCDNOrigin } from '../module/env/location/get/origin/media';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI } from '../module/env/uri';
import { CurrentRouteInfoKey, parseCurrentRouteInfo } from '../module/type/CurrentRouteInfo';
import { min } from '../module/math';
import type { Timeout } from '../module/timer/type';
import { removeTimeout } from '../module/timer/remove/timeout';
import { createAnchorElement } from '../module/dom/element/anchor/create';
import { concatenateLocationPrefixToHost } from '../module/env/location/build/host';
import { getLocationPrefix } from '../module/env/location/get/location_prefix';
import { WEBSITE_APEX_HOSTNAME } from '../module/env/website_apex_hostname';
import { getFullPath } from '../module/dom/location/get/full_path';
import { appendText } from '../module/dom/element/text/append';

let pivot: Pivot;
let keywords: string;
let currentRequest: APIRequest<string> | null = null;
let currentSearchAnimationTimeout: Timeout | null = null;

const eventTargetsTracker = new Set<EventTarget>();

export default function (seriesInfo: SeriesInfo, _keywords: string) {
    addOffloadCallback(offload);
    pivot = 0;
    keywords = _keywords;

    const searchBar = createDivElement();
    addClass(searchBar, styles.searchBar, inputFieldClass);

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
        searchBarInput.disabled = disabled;
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
        -256 - 24,
    );

    appendChildren(body, searchBar, containerElem, loadingTextContainer, positionDetector);

    const maintenanceInfo = seriesInfo[SeriesInfoKey.MAINTENANCE];
    if (maintenanceInfo !== undefined) {
        let message = '';
        const maintenanceStart = maintenanceInfo[MaintenanceInfoKey.START];
        const maintenancePeriod = maintenanceInfo[MaintenanceInfoKey.PERIOD];
        const startTime = toLocalTimeString(maintenanceStart, false, false);
        if (maintenancePeriod > 0) {
            const endTime = toLocalTimeString(maintenanceStart + maintenancePeriod, false, false);
            message = `${startTime}～${endTime}の間、メンテナンスを実施する予定です。`;
        } else {
            message = `メンテナンス開始は${startTime}を予定しております。`;
        }
        message += 'ご不便をおかけして申し訳ありません。';
        showAnnouncement('メンテナンスのお知らせ', CSS_COLOR.ORANGE, [createTextNode(message)], containerElem);
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
    const currentURI = getURI();
    setCustomPopStateHandler(() => {
        if (currentURI !== getURI()) {
            return false;
        }
        searchClosure(true);
        return true;
    });
    if (ENABLE_DEBUG) {
        showTestingWarning(containerElem);
    }
    showASNAnnouncement(containerElem);
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

        addEventListener(seriesNode, 'click', () => {
            goToSeries(seriesEntry[SeriesEntryKey.ID]);
        });
        eventTargetsTracker.add(seriesNode);

        appendChild(containerElem, seriesNode);
        attachLazyload(thumbnailNode, getMediaCDNOrigin() + '/thumbnails/' + seriesEntry[SeriesEntryKey.THUMBNAIL], 'サムネイル：' + title);
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
        setURLKeywords(keywords);
    }

    setOpacity(containerElem, 0);
    setOpacity(loadingTextContainer, 0);
    let callback: (() => void) | null = null;
    if (currentSearchAnimationTimeout !== null) {
        removeTimeout(currentSearchAnimationTimeout);
    }
    currentSearchAnimationTimeout = addTimeout(() => {
        currentSearchAnimationTimeout = null;
        for (const eventTarget of eventTargetsTracker) {
            removeAllEventListeners(eventTarget);
        }
        eventTargetsTracker.clear();
        offloadLazyload();
        replaceChildren(containerElem);
        callback?.();
    }, 400);

    getSeries((seriesInfo) => {
        // This function won't be called if another search is triggered before the current one finishes,
        // because the current request will be aborted and timeout will be removed.
        callback = () => {
            showSeries(
                seriesInfo,
                containerElem,
                loadingTextContainer,
                infiniteScrolling,
            );
            setOpacity(containerElem, 1);
            setOpacity(loadingTextContainer, 1);
            disableSearchBarInput(false);
        };
        if (currentSearchAnimationTimeout === null) {
            callback();
        }
    });
}

function goToSeries(id: string) {
    redirectSameOrigin(BANGUMI_ROOT_URI + id + '/1');
}

function getSeries(callback: (seriesInfo: SeriesInfo) => void) {
    if (pivot === 'EOF') {
        return;
    }
    currentRequest?.[APIRequestKey.ABORT]();
    const keywordsQuery = buildHttpForm({ keywords: keywords });
    currentRequest = sendAPIRequest('get_series', {
        [APIRequestOptionKey.CALLBACK]: function (response: string) {
            currentRequest = null;
            callback(parseResponse(response, parseSeriesInfo));
        },
        [APIRequestOptionKey.CONTENT]: joinHttpForms(keywordsQuery, buildHttpForm({ pivot: pivot })),
        [APIRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
        [APIRequestOptionKey.METHOD]: 'GET',
    });
}

function showASNAnnouncement(containerElem: HTMLElement, retryTimeout = 500) {
    const retry = () => {
        addTimeout(() => {
            showASNAnnouncement(containerElem, min(retryTimeout * 2, 5000));
        }, retryTimeout);
    };
    const xhr = newXhr(
        getAPIOrigin('') + '/get_route_info',
        'GET',
        false,
        () => {
            if (xhr.status !== 200) {
                retry();
                return;
            }
            const routeInfo = parseCurrentRouteInfo(JSON.parse(xhr.responseText));
            if (routeInfo[CurrentRouteInfoKey.TYPE] === 'cn') {
                const message = [
                    createTextNode('現在、中国ユーザー向けの特別回線をご利用中です。中国国外にお住まいの場合は、この回線の使用をお控えください。詳しくは'),
                    createSpanElement('「中国のユーザーの皆様へのお知らせ」'),
                    createTextNode('をご覧ください。'),
                ] as const;
                addClass(message[1], linkClass);
                addEventListener(message[1], 'click', () => {
                    redirectSameOrigin(NEWS_ROOT_URI + '2ghJ5dHKW8T');
                });
                showAnnouncement('特別回線をご利用中', CSS_COLOR.ORANGE, message, containerElem);
                return;
            }
            if (routeInfo[CurrentRouteInfoKey.COUNTRY] !== 'CN') {
                return;
            }
            const message = [
                createTextNode('中国から当サイトにアクセスしていることを検知しました。ネットワーク速度を改善する方法については、'),
                createSpanElement('「中国のユーザーの皆様へのお知らせ」'),
                createTextNode('をご覧ください。'),
            ] as const;
            addClass(message[1], linkClass);
            addEventListener(message[1], 'click', () => {
                redirectSameOrigin(NEWS_ROOT_URI + '2ghJ5dHKW8T');
            });
            showAnnouncement('ネットワーク速度が低下している場合', CSS_COLOR.ORANGE, message, containerElem);
        },
    );
    addEventListener(xhr, 'error', retry);
    xhr.send();
}

function showTestingWarning(containerElem: HTMLElement) {
    const linkToProd = createAnchorElement();
    const prodOrigin = 'https://' + concatenateLocationPrefixToHost(getLocationPrefix(), WEBSITE_APEX_HOSTNAME);
    linkToProd.href = prodOrigin + getFullPath();
    appendText(linkToProd, prodOrigin);
    const message = [
        createTextNode('現在ご利用いただいているのはテスト版です。新機能のテスト中につき、不安定な動作や不具合が発生する可能性があります。'),
        linkToProd,
        createTextNode('から正式版をご利用ください。'),
    ] as const;
    addClass(message[1], linkClass);
    showAnnouncement('テスト版をご利用中', CSS_COLOR.RED, message, containerElem);
}

function showAnnouncement(title: string, titleColor: CSS_COLOR, message: readonly Node[], containerElem: HTMLElement) {
    const annoucementOuterContainer = createDivElement();
    const announcementInnerContainer = createDivElement();
    addClass(annoucementOuterContainer, styles.announcement);
    appendChild(annoucementOuterContainer, announcementInnerContainer);
    insertBefore(annoucementOuterContainer, containerElem);

    const announcementTitle = createParagraphElement(title);
    addClass(announcementTitle, styles.announcementTitle);
    changeColor(announcementTitle, titleColor);
    appendChild(announcementInnerContainer, announcementTitle);

    const announcementBody = createParagraphElement();
    appendChildren(announcementBody, ...message);
    addClass(announcementBody, styles.announcementBody);
    appendChild(announcementInnerContainer, announcementBody);
}

function offload() {
    offloadLazyload();
    eventTargetsTracker.clear();
    currentRequest = null;
    currentSearchAnimationTimeout = null;
}
