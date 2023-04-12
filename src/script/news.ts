// JavaScript Document
import 'core-js';
import {
    CDN_URL,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    clearCookies,
    scrollToHash,
    navListeners,
    encodeCFURIComponent,
    removeRightClick,
    getLocalTime,
} from './module/main';
import {
    w,
    addEventListener,
    getBaseURL,
    redirect,
    getById,
    createElement,
    addClass,
    appendChild,
    removeClass,
    getBody,
    getDescendantsByClass,
    openWindow,
    changeURL,
    setTitle,
    getTitle,
    getHash,
    getDataAttribute,
    showElement,
    setDataAttribute,
    containsClass,
    setCookie,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { moduleImportError } from './module/message/template/param';
import * as AllNewsInfo from './module/type/AllNewsInfo';
import * as NewsInfo from './module/type/NewsInfo';
import initializeInfiniteScrolling from './module/infinite_scrolling';
import { default as importLazyload } from './module/lazyload';
import isbot from 'isbot';
import { LocalImageParam } from './module/type/LocalImageParam';

const NEWS_TOP_URL = TOP_URL + '/news/';
let pivot: AllNewsInfo.PivotInfo = 0;
let infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;
let lazyloadImportPromise: ReturnType<typeof importLazyload>;

addEventListener(w, 'load', function () {
    if (!getBaseURL().startsWith(NEWS_TOP_URL)) {
        redirect(NEWS_TOP_URL, true);
        return;
    }

    clearCookies();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getBaseURL() !== NEWS_TOP_URL) {
            changeURL(NEWS_TOP_URL, true);
        }
        infiniteScrolling = initializeInfiniteScrolling(getAllNews);
        getAllNews();
    } else {
        lazyloadImportPromise = importLazyload();
        getNews(newsID);
    }
});

function getNewsID(): string | null {
    const start = NEWS_TOP_URL.length;
    return getBaseURL().substring(start);
}

function getNews(newsID: string): void {
    const hash = getHash();
    sendServerRequest('get_news.php' + '?id=' + newsID, {
        callback: function (response: string) {
            let parsedResponse: NewsInfo.NewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                NewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            showNews(parsedResponse, newsID);
            navListeners();
            showElement(getBody());
            scrollToHash(true);
        },
        method: 'GET',
        logoutParam: 'news=' + newsID + ((hash === '') ? '' : ('&hash=' + hash))
    });
}

function showNews(newsInfo: NewsInfo.NewsInfo, newsID: string): void {
    const outerContainer = createElement('div');
    const container = createElement('div');
    container.id = 'content-container';

    const titleContainer = createElement('p');
    titleContainer.id = 'title';

    titleContainer.innerHTML = newsInfo.title;
    setTitle(newsInfo.title + ' | ' + getTitle());
    appendChild(container, titleContainer);

    const createTimeContainer = createElement('p');
    addClass(createTimeContainer, 'date');

    const createTime = getLocalTime(newsInfo.create_time);
    createTimeContainer.innerHTML = '初回掲載日：' + createTime.year + '年' + createTime.month + '月' + createTime.date + '日（' + createTime.dayOfWeek + '）' + createTime.hour + '時' + createTime.minute + '分' + createTime.second + '秒';
    appendChild(container, createTimeContainer);

    if (newsInfo.update_time !== null) {
        const updateTimeContainer = createElement('p');
        addClass(updateTimeContainer, 'date');

        const updateTime = getLocalTime(newsInfo.update_time);
        updateTimeContainer.innerHTML = '最終更新日：' + updateTime.year + '年' + updateTime.month + '月' + updateTime.date + '日（' + updateTime.dayOfWeek + '）' + updateTime.hour + '時' + updateTime.minute + '分' + updateTime.second + '秒';
        appendChild(container, updateTimeContainer);
    }

    appendChild(container, createElement('hr'));

    const contentContainer = createElement('div');
    contentContainer.id = 'content';
    contentContainer.innerHTML = newsInfo.content;
    appendChild(container, contentContainer);

    appendChild(outerContainer, container);
    appendChild(getById('main'), outerContainer);

    bindEventListners(contentContainer);
    attachImage(contentContainer, newsID);
}

function attachImage(contentContainer: HTMLElement, newsID: string): void {
    const baseURL = CDN_URL + '/news/' + newsID + '/';
    const elems = getDescendantsByClass(contentContainer, 'image-internal');
    for (const elem of elems) {
        addClass(elem, 'lazyload');
        const src = getDataAttribute(elem, 'src');
        if (src === null) {
            continue;
        }
        const xhrParam = encodeURIComponent(JSON.stringify({ news: newsID, file: src }));
        setDataAttribute(elem, 'src', baseURL + encodeCFURIComponent(src));
        setDataAttribute(elem, 'alt', src);
        setDataAttribute(elem, 'xhr-param', xhrParam);
        if (containsClass(elem, 'image-enlarge')) {
            addEventListener(elem, 'click', function () {
                const param: LocalImageParam = {
                    baseURL: baseURL,
                    fileName: src,
                    xhrParam: xhrParam,
                    title: getTitle(),
                    mediaSessionCredential: null
                };
                setCookie('local-image-param', JSON.stringify(param), 10);
                openWindow(TOP_URL + '/image');
            });
        }
        removeRightClick(elem);
    }
    lazyloadImportPromise.then((lazyloadInitialize) => {
        lazyloadInitialize();
    }).catch((e) => {
        showMessage(moduleImportError(e));
    });
}

function bindEventListners(contentContainer: HTMLElement): void {
    const elems = getDescendantsByClass(contentContainer, 'open-window');
    for (const elem of (elems as HTMLCollectionOf<HTMLElement>)) {
        addEventListener(elem, 'click', function () {
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

function getAllNews(): void {
    if (pivot === 'EOF') {
        return;
    }

    sendServerRequest('get_all_news.php', {
        callback: function (response: string) {
            let parsedResponse: AllNewsInfo.AllNewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                AllNewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            addClass(getBody(), 'invisible'); // Infinite scrolling does not work when element 'display' property is set to 'none'.
            showElement(getBody());
            showAllNews(parsedResponse);
            navListeners();
            removeClass(getBody(), 'invisible');
        },
        content: 'pivot=' + pivot
    });
}

function showAllNews(allNewsInfo: AllNewsInfo.AllNewsInfo): void {
    pivot = allNewsInfo[allNewsInfo.length - 1] as AllNewsInfo.PivotInfo;
    const allNewsInfoEntries = allNewsInfo.slice(0, -1) as AllNewsInfo.AllNewsInfoEntries;
    for (const entry of allNewsInfoEntries) {
        const overviewContainer = createElement('div');
        addClass(overviewContainer, 'overview-container');

        const dateContainer = createElement('div');
        addClass(dateContainer, 'date');
        const updateTime = getLocalTime(entry.update_time);
        dateContainer.innerHTML = updateTime.year + '年';
        appendChild(dateContainer, createElement('br'));
        dateContainer.innerHTML += updateTime.month.toString().padStart(2, '0') + '月' + updateTime.date.toString().padStart(2, '0') + '日';

        const titleContainer = createElement('div');
        titleContainer.innerHTML = entry.title;
        addClass(titleContainer, 'overview-title');
        addClass(titleContainer, 'ellipsis-clipping-2');

        appendChild(overviewContainer, dateContainer);
        appendChild(overviewContainer, titleContainer);

        addEventListener(overviewContainer, 'click', function () {
            redirect(NEWS_TOP_URL + entry.id);
        });

        appendChild(getById('main'), overviewContainer);
    }
    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}