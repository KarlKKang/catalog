import {
    CDN_URL,
    TOP_URL,
} from './module/env/constant';
import {
    scrollToHash,
    removeRightClick,
    openImageWindow,
    SessionTypes,
} from './module/common';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { sendServerRequest, setUpSessionAuthentication } from './module/server';
import {
    addEventListener,
    getBaseURL,
    addClass,
    appendChild,
    getDescendantsByClass,
    changeURL,
    setTitle,
    getTitle,
    getHash,
    getDataAttribute,
    containsClass,
    createDivElement,
    createParagraphElement,
    createHRElement,
    createBRElement,
    appendText,
    removeAllEventListeners,
    clearSessionStorage,
    replaceText,
    body,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse, notFound } from './module/server/message';
import * as AllNewsInfo from './module/type/AllNewsInfo';
import * as NewsInfo from './module/type/NewsInfo';
import { getInfiniteScrolling, initializeInfiniteScrolling, destroy as destroyInfiniteScrolling } from './module/infinite_scrolling';
import { encodeCFURIComponent, getLocalTime, getLocalTimeString } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { pgid, redirect } from './module/global';
import { lazyloadImport, unloadLazyload } from './module/lazyload';
import { allResultsShown, loading, noResult } from './module/text/ui';
import '../css/news.scss';
import { addManualAllLanguageClass } from './module/dom/create_element/all_language';

const NEWS_TOP_URL = TOP_URL + '/news/';
let pivot: AllNewsInfo.PivotInfo;

export default function (showPage: ShowPageFunc) {
    pivot = 0;

    clearSessionStorage();

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getBaseURL() !== NEWS_TOP_URL) {
            changeURL(NEWS_TOP_URL, true);
        }
        const loadingTextContainer = createParagraphElement();
        loadingTextContainer.id = 'loading-text';
        getAllNews(showPage, loadingTextContainer);
    } else {
        const lazyloadImportPromise = lazyloadImport();
        getNews(lazyloadImportPromise, newsID, showPage);
    }
}

function getNewsID(): string | null {
    const start = NEWS_TOP_URL.length;
    return getBaseURL().substring(start);
}

function getNews(lazyloadImportPromise: ReturnType<typeof lazyloadImport>, newsID: string, showPage: ShowPageFunc): void {
    const hash = getHash();
    const logoutParam = 'news=' + newsID + (hash === '' ? '' : ('&hash=' + hash));
    sendServerRequest('get_news', {
        callback: function (response: string) {
            let parsedResponse: NewsInfo.NewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                NewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }
            setUpSessionAuthentication(parsedResponse.credential, logoutParam);
            showPage();

            const contentContainer = createDivElement();
            contentContainer.id = 'content';
            const loadingText = createParagraphElement(loading);
            loadingText.id = 'loading-text';
            appendChild(contentContainer, loadingText);

            const container = createDivElement();
            container.id = 'container';
            appendChild(body, container);
            showNews(container, contentContainer, parsedResponse);
            addNavBar(NavBarPage.NEWS, () => {
                redirect(NEWS_TOP_URL);
            });

            const xhr = new XMLHttpRequest();
            xhr.open('GET', CDN_URL + '/news/' + newsID + '.html');
            xhr.withCredentials = true;

            addEventListener(xhr, 'error', () => {
                removeAllEventListeners(xhr);
                showMessage(notFound);
            });
            addEventListener(xhr, 'abort', () => {
                removeAllEventListeners(xhr);
            });
            addEventListener(xhr, 'load', () => {
                removeAllEventListeners(xhr);
                if (xhr.status === 200) {
                    contentContainer.innerHTML = xhr.responseText;
                    addManualAllLanguageClass(contentContainer);
                    bindEventListners(contentContainer);
                    attachImage(lazyloadImportPromise, contentContainer, newsID, parsedResponse.credential);
                    scrollToHash();
                } else {
                    showMessage(notFound);
                }
            });

            xhr.send();
        },
        content: 'id=' + newsID,
        logoutParam: logoutParam
    });
}

function showNews(container: HTMLElement, contentContainer: HTMLElement, newsInfo: NewsInfo.NewsInfo) {
    const contentOuterContainer = createDivElement();
    contentOuterContainer.id = 'content-outer-container';
    const contentInnerContainer = createDivElement();
    contentInnerContainer.id = 'content-container';

    const titleContainer = createParagraphElement(newsInfo.title);
    titleContainer.id = 'title';

    setTitle(newsInfo.title + ' | ' + getTitle());
    appendChild(contentInnerContainer, titleContainer);

    const createTime = getLocalTimeString(newsInfo.create_time, true, false);
    const createTimeContainer = createParagraphElement('初回掲載日：' + createTime);
    addClass(createTimeContainer, 'date');
    appendChild(contentInnerContainer, createTimeContainer);

    if (newsInfo.update_time !== null) {
        const updateTime = getLocalTimeString(newsInfo.update_time, true, false);
        const updateTimeContainer = createParagraphElement('最終更新日：' + updateTime);
        addClass(updateTimeContainer, 'date');
        appendChild(contentInnerContainer, updateTimeContainer);
    }

    appendChild(contentInnerContainer, createHRElement());
    appendChild(contentInnerContainer, contentContainer);

    appendChild(contentOuterContainer, contentInnerContainer);
    appendChild(container, contentOuterContainer);
}

async function attachImage(lazyloadImportPromise: ReturnType<typeof lazyloadImport>, contentContainer: HTMLElement, newsID: string, credential: string): Promise<void> {
    const currentPgid = pgid;
    const lazyload = await lazyloadImportPromise;
    if (currentPgid !== pgid) {
        return;
    }
    lazyload.setCredential(credential, SessionTypes.NEWS);

    const baseURL = CDN_URL + '/news/' + newsID + '/';
    const elems = getDescendantsByClass(contentContainer, 'image-internal');
    for (const elem of elems) {
        addClass(elem, 'lazyload');
        const src = getDataAttribute(elem, 'src');
        if (src === null) {
            continue;
        }
        lazyload.default(elem, baseURL + encodeCFURIComponent(src), src, { delay: 250 });
        if (containsClass(elem, 'image-enlarge')) {
            addEventListener(elem, 'click', () => {
                openImageWindow(baseURL, src, credential, SessionTypes.NEWS);
            });
        }
        removeRightClick(elem);
    }
}

function bindEventListners(contentContainer: HTMLElement): void {
    const elems = getDescendantsByClass(contentContainer, 'open-window');
    for (const elem of (elems as HTMLCollectionOf<HTMLElement>)) {
        addEventListener(elem, 'click', () => {
            const page = getDataAttribute(elem, 'page');

            if (page === 'news') {
                const newsID = getDataAttribute(elem, 'news-id');
                if (newsID !== null) {
                    redirect(NEWS_TOP_URL + newsID);
                }
                return;
            }

            if (page === 'bangumi') {
                let separator: '?' | '&' = '?';
                const seriesID = getDataAttribute(elem, 'series-id');

                if (seriesID === null) {
                    return;
                }

                let url = TOP_URL + '/bangumi/' + seriesID;

                const epIndex = getDataAttribute(elem, 'ep-index');
                if (epIndex !== null) {
                    url += separator + 'ep=' + epIndex;
                    separator = '&';
                }
                const formatIndex = getDataAttribute(elem, 'format-index');
                if (formatIndex !== null) {
                    url += separator + 'format=' + formatIndex;
                }

                redirect(url);
                return;
            }
        });
    }
}

function getAllNews(showPage: ShowPageFunc, loadingTextContainer: HTMLElement): void;
function getAllNews(container: HTMLElement, loadingTextContainer: HTMLElement): void;
function getAllNews(containerOrShowPage: ShowPageFunc | HTMLElement, loadingTextContainer: HTMLElement): void {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest('get_all_news?pivot=' + pivot, {
        callback: function (response: string) {
            let parsedResponse: AllNewsInfo.AllNewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                AllNewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            if (!(containerOrShowPage instanceof HTMLElement)) {
                (containerOrShowPage as ShowPageFunc)();
                const container = createDivElement();
                container.id = 'container';
                appendChild(body, container);
                appendChild(body, loadingTextContainer);
                const positionDetector = createDivElement();
                appendChild(body, positionDetector);
                addNavBar(NavBarPage.NEWS);
                initializeInfiniteScrolling(positionDetector, () => { getAllNews(container, loadingTextContainer); });
                containerOrShowPage = container;
            }
            showAllNews(containerOrShowPage, parsedResponse, loadingTextContainer);
        },
        method: 'GET',
    });
}

function showAllNews(container: HTMLElement, allNewsInfo: AllNewsInfo.AllNewsInfo, loadingTextContainer: HTMLElement): void {
    const newPivot = allNewsInfo[allNewsInfo.length - 1] as AllNewsInfo.PivotInfo;
    const allNewsInfoEntries = allNewsInfo.slice(0, -1) as AllNewsInfo.AllNewsInfoEntries;

    if (pivot === 0 && allNewsInfoEntries.length === 0) {
        replaceText(loadingTextContainer, noResult);
    } else {
        if (newPivot === 'EOF') {
            replaceText(loadingTextContainer, allResultsShown);
        } else {
            replaceText(loadingTextContainer, loading);
        }
    }

    pivot = newPivot;
    for (const entry of allNewsInfoEntries) {
        const overviewContainer = createDivElement();
        addClass(overviewContainer, 'overview-container');

        const dateContainer = createDivElement();
        addClass(dateContainer, 'date');
        const updateTime = getLocalTime(entry.update_time);
        appendText(dateContainer, updateTime.year + '年');
        appendChild(dateContainer, createBRElement());
        appendText(dateContainer, updateTime.month.toString().padStart(2, '0') + '月' + updateTime.date.toString().padStart(2, '0') + '日');

        const titleContainer = createDivElement();
        appendText(titleContainer, entry.title);
        addClass(titleContainer, 'overview-title');
        addClass(titleContainer, 'ellipsis-clipping-2');

        appendChild(overviewContainer, dateContainer);
        appendChild(overviewContainer, titleContainer);

        addEventListener(overviewContainer, 'click', () => {
            redirect(NEWS_TOP_URL + entry.id);
        });

        appendChild(container, overviewContainer);
    }
    const infiniteScrolling = getInfiniteScrolling();
    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

export function offload() {
    unloadLazyload();
    destroyInfiniteScrolling();
}