// JavaScript Document
import {
    CDN_URL,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    scrollToHash,
    addNavBar,
    removeRightClick,
    NAV_BAR_NEWS,
} from './module/common';
import {
    addEventListener,
    getBaseURL,
    getById,
    addClass,
    appendChild,
    getDescendantsByClass,
    openWindow,
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
    setSessionStorage,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse, notFound } from './module/message/template/param/server';
import { moduleImportError } from './module/message/template/param';
import * as AllNewsInfo from './module/type/AllNewsInfo';
import * as NewsInfo from './module/type/NewsInfo';
import { getInfiniteScrolling, initializeInfiniteScrolling, destroy as destroyInfiniteScrolling } from './module/infinite_scrolling';
import type { default as LazyloadObserve } from './module/lazyload';
import { encodeCFURIComponent, getLocalTime, getLocalTimeString } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

let pageLoaded: boolean;

const NEWS_TOP_URL = TOP_URL + '/news/';
let pivot: AllNewsInfo.PivotInfo;

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

let redirect: RedirectFunc;

export default function (showPage: ShowPageFunc, _redirect: RedirectFunc) {
    pageLoaded = true;
    pivot = 0;
    redirect = _redirect;

    clearSessionStorage();

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getBaseURL() !== NEWS_TOP_URL) {
            changeURL(NEWS_TOP_URL, true);
        }
        getAllNews(showPage);
    } else {
        const lazyloadImportPromise = import(
            /* webpackExports: ["default", "unobserveAll"] */
            './module/lazyload'
        );
        import(
            /* webpackExports: ["clearAllImageEvents"] */
            './module/image_loader'
        ).then((imageLoaderModule) => {
            imageLoader = imageLoaderModule;
        }); // Lazyload will handle if this import fails.
        getNews(lazyloadImportPromise, newsID, showPage);
    }
}

function getNewsID(): string | null {
    const start = NEWS_TOP_URL.length;
    return getBaseURL().substring(start);
}

function getNews(lazyloadImportPromise: Promise<Lazyload>, newsID: string, showPage: ShowPageFunc): void {
    const hash = getHash();
    sendServerRequest(redirect, 'get_news', {
        callback: function (response: string) {
            let parsedResponse: NewsInfo.NewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                NewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(redirect, invalidResponse());
                return;
            }

            const showPagePromise = new Promise<HTMLDivElement>((resolve) => {
                showPage(() => {
                    const contentContainer = showNews(getById('container'), parsedResponse);
                    addNavBar(redirect, NAV_BAR_NEWS, () => {
                        redirect(NEWS_TOP_URL);
                    });
                    resolve(contentContainer);
                });
            });

            const xhr = new XMLHttpRequest();
            xhr.open('GET', CDN_URL + '/news/' + newsID + '.html');
            xhr.withCredentials = true;

            addEventListener(xhr, 'error', () => {
                removeAllEventListeners(xhr);
                showMessage(redirect, notFound);
            });
            addEventListener(xhr, 'abort', () => {
                removeAllEventListeners(xhr);
            });
            addEventListener(xhr, 'load', () => {
                removeAllEventListeners(xhr);
                if (xhr.status === 200) {
                    showPagePromise.then((contentContainer) => {
                        if (!pageLoaded) {
                            return;
                        }
                        contentContainer.innerHTML = xhr.responseText;
                        bindEventListners(contentContainer);
                        attachImage(lazyloadImportPromise, contentContainer, newsID);
                        scrollToHash();
                    });
                } else {
                    showMessage(redirect, notFound);
                }
            });

            xhr.send();
        },
        content: 'id=' + newsID,
        logoutParam: 'news=' + newsID + ((hash === '') ? '' : ('&hash=' + hash))
    });
}

function showNews(container: HTMLElement, newsInfo: NewsInfo.NewsInfo): HTMLDivElement {
    const contentOuterContainer = createDivElement();
    contentOuterContainer.id = 'content-outer-container';
    const contentContainer = createDivElement();
    contentContainer.id = 'content-container';

    const titleContainer = createParagraphElement();
    titleContainer.id = 'title';

    appendText(titleContainer, newsInfo.title);
    setTitle(newsInfo.title + ' | ' + getTitle());
    appendChild(contentContainer, titleContainer);

    const createTimeContainer = createParagraphElement();
    addClass(createTimeContainer, 'date');

    const createTime = getLocalTimeString(newsInfo.create_time, true, false);
    appendText(createTimeContainer, '初回掲載日：' + createTime);
    appendChild(contentContainer, createTimeContainer);

    if (newsInfo.update_time !== null) {
        const updateTimeContainer = createParagraphElement();
        addClass(updateTimeContainer, 'date');

        const updateTime = getLocalTimeString(newsInfo.update_time, true, false);
        appendText(updateTimeContainer, '最終更新日：' + updateTime);
        appendChild(contentContainer, updateTimeContainer);
    }

    appendChild(contentContainer, createHRElement());

    const content = createDivElement();
    content.id = 'content';
    appendChild(contentContainer, content);

    appendChild(contentOuterContainer, contentContainer);
    appendChild(container, contentOuterContainer);

    return content;
}

async function attachImage(lazyloadImportPromise: Promise<Lazyload>, contentContainer: HTMLElement, newsID: string): Promise<void> {
    let lazyloadObserve: typeof LazyloadObserve;
    try {
        lazyload = (await lazyloadImportPromise);
        if (!pageLoaded) {
            return;
        }
        lazyloadObserve = lazyload.default;
    } catch (e) {
        showMessage(redirect, moduleImportError(e));
        throw e;
    }

    const baseURL = CDN_URL + '/news/' + newsID + '/';
    const elems = getDescendantsByClass(contentContainer, 'image-internal');
    for (const elem of elems) {
        addClass(elem, 'lazyload');
        const src = getDataAttribute(elem, 'src');
        if (src === null) {
            continue;
        }
        const xhrParam = 'news=' + newsID;
        lazyloadObserve(elem, baseURL + encodeCFURIComponent(src), src, redirect, { xhrParam: xhrParam });
        if (containsClass(elem, 'image-enlarge')) {
            addEventListener(elem, 'click', () => {
                setSessionStorage('base-url', baseURL);
                setSessionStorage('file-name', src);
                setSessionStorage('xhr-param', xhrParam);
                setSessionStorage('title', getTitle());
                openWindow(TOP_URL + '/image');
                clearSessionStorage();
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
                    openWindow(NEWS_TOP_URL + newsID);
                }
                return;
            }

            if (page === 'bangumi') {
                let separator: '?' | '&' = '?';
                const seriesID = getDataAttribute(elem, 'series-id');

                if (seriesID === null) {
                    return;
                }

                let url = TOP_URL + '/bangumi/';

                const epIndex = getDataAttribute(elem, 'ep-index');
                if (epIndex !== null) {
                    url += separator + 'ep=' + epIndex;
                    separator = '&';
                }
                const formatIndex = getDataAttribute(elem, 'format-index');
                if (formatIndex !== null) {
                    url += separator + 'format=' + formatIndex;
                }

                openWindow(url);
                return;
            }
        });
    }
}

function getAllNews(showPage: ShowPageFunc): void;
function getAllNews(container: HTMLElement): void;
function getAllNews(containerOrShowPage: unknown): void {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest(redirect, 'get_all_news', {
        callback: function (response: string) {
            let parsedResponse: AllNewsInfo.AllNewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                AllNewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(redirect, invalidResponse());
                return;
            }

            if (containerOrShowPage instanceof HTMLElement) {
                showAllNews(containerOrShowPage, parsedResponse);
            } else {
                (containerOrShowPage as ShowPageFunc)(() => {
                    addNavBar(redirect, NAV_BAR_NEWS);
                    const container = getById('container');
                    initializeInfiniteScrolling(() => { getAllNews(container); });
                    showAllNews(container, parsedResponse);
                });
            }
        },
        content: 'pivot=' + pivot
    });
}

function showAllNews(container: HTMLElement, allNewsInfo: AllNewsInfo.AllNewsInfo): void {
    pivot = allNewsInfo[allNewsInfo.length - 1] as AllNewsInfo.PivotInfo;
    const allNewsInfoEntries = allNewsInfo.slice(0, -1) as AllNewsInfo.AllNewsInfoEntries;
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
    pageLoaded = false;
    lazyload?.unobserveAll();
    lazyload = null;
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
    destroyInfiniteScrolling();
}