// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    clearCookies,
    cssVarWrapper,
    getURLParam,
    scrollToHash,
    navListeners,
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
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
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { AllNewsInfo, NewsInfo } from './module/type';
import initializeInfiniteScrolling from './module/infinite_scrolling';

const NEWS_TOP_URL = TOP_URL + '/news/';
var offset: AllNewsInfo.OffsetInfo = 0;
var infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;

addEventListener(w, 'load', function () {
    if (!getHref().startsWith(NEWS_TOP_URL) && !DEVELOPMENT) {
        redirect(NEWS_TOP_URL, true);
        return;
    }

    cssVarWrapper();
    clearCookies();

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getHref() !== NEWS_TOP_URL && !DEVELOPMENT) {
            changeURL(NEWS_TOP_URL, true);
        }
        infiniteScrolling = initializeInfiniteScrolling(getAllNews);
        getAllNews();
    } else {
        getNews(newsID);
    }
});

function getNewsID(): string | null {
    if (DEVELOPMENT) {
        return getURLParam('id');
    } else {
        const url = getHref() + '?#';
        const start = NEWS_TOP_URL.length;
        const end = Math.min(url.indexOf('?'), url.indexOf('#'));
        return url.slice(start, end);
    }
}

function getNews(newsID: string): void {
    const hash = getHash();
    sendServerRequest('get_news.php' + '?id=' + newsID, {
        callback: function (response: string) {
            var parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                NewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            showNews(parsedResponse as NewsInfo.NewsInfo);
            navListeners();
            removeClass(getBody(), "hidden");
            scrollToHash(true);
        },
        method: 'GET',
        logoutParam: 'news=' + newsID + ((hash === '') ? '' : ('&hash=' + hash))
    });
}

function showNews(newsInfo: NewsInfo.NewsInfo): void {
    let outerContainer = createElement('div');
    let container = createElement('div');
    container.id = 'content-container';

    let titleContainer = createElement('p');
    titleContainer.id = 'title';

    titleContainer.innerHTML = newsInfo.title;
    setTitle(newsInfo.title + ' | ' + getTitle());
    appendChild(container, titleContainer);

    let createTimeContainer = createElement('p');
    addClass(createTimeContainer, 'date');

    let createTime = new Date(newsInfo.create_time * 1000);
    createTimeContainer.innerHTML = '初回掲載日：' + createTime.getFullYear() + '年' + (createTime.getMonth() + 1) + '月' + createTime.getDate() + '日（' + getDayOfWeek(createTime) + '）' + createTime.getHours() + '時' + createTime.getMinutes() + '分' + createTime.getSeconds() + '秒';
    appendChild(container, createTimeContainer);

    if (newsInfo.update_time !== null) {
        let updateTimeContainer = createElement('p');
        addClass(updateTimeContainer, 'date');

        let updateTime = new Date(newsInfo.update_time * 1000);
        updateTimeContainer.innerHTML = '最終更新日：' + updateTime.getFullYear() + '年' + (updateTime.getMonth() + 1) + '月' + updateTime.getDate() + '日（' + getDayOfWeek(createTime) + '）' + createTime.getHours() + '時' + createTime.getMinutes() + '分' + createTime.getSeconds() + '秒';
        appendChild(container, updateTimeContainer);
    }

    appendChild(container, createElement('hr'));

    let contentContainer = createElement('div');
    contentContainer.id = 'content';
    contentContainer.innerHTML = newsInfo.content;
    appendChild(container, contentContainer);

    appendChild(outerContainer, container);
    appendChild(getById('main'), outerContainer);

    bindEventListners(contentContainer);
}

function bindEventListners(contentContainer: HTMLElement): void {
    var elems = getDescendantsByClass(contentContainer, 'open-window');
    for (let elem of (elems as HTMLCollectionOf<HTMLElement>)) {
        addEventListener(elem, 'click', function () {
            const page = elem.dataset.page;

            if (page === 'news') {
                const newsID = elem.dataset.newsId;
                if (newsID !== undefined) {
                    openWindow(DEVELOPMENT ? ('news.html?id=' + newsID) : (NEWS_TOP_URL + newsID));
                }
                return;
            }

            if (page === 'bangumi') {
                let separator: '?' | '&' = '?';
                const seriesID = elem.dataset.seriesId;

                if (seriesID === undefined) {
                    return;
                }

                let url: string;
                if (DEVELOPMENT) {
                    url = 'bangumi.html?series=' + seriesID;
                    separator = '&';
                } else {
                    url = TOP_URL + '/bangumi/';
                }

                const epIndex = elem.dataset.epIndex;
                if (epIndex !== undefined) {
                    url += separator + 'ep=' + epIndex;
                    separator = '&';
                }
                const formatIndex = elem.dataset.formatIndex;
                if (formatIndex !== undefined) {
                    url += separator + 'format=' + formatIndex;
                }

                openWindow(url);
                return;
            }
        });
    }
}

function getAllNews(): void {
    if (offset === 'EOF') {
        return;
    }

    sendServerRequest('get_all_news.php', {
        callback: function (response: string) {
            var parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                AllNewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            showAllNews(parsedResponse as AllNewsInfo.AllNewsInfo);
            navListeners();
            removeClass(getBody(), "hidden");
        },
        content: 'offset=' + offset
    });
}

function showAllNews(allNewsInfo: AllNewsInfo.AllNewsInfo): void {
    var entries = allNewsInfo.slice(0, -1) as AllNewsInfo.AllNewsInfoEntries;
    for (let entry of entries) {
        let overviewContainer = createElement('div');
        addClass(overviewContainer, 'overview-container');

        let dateContainer = createElement('div');
        addClass(dateContainer, 'date');
        let updateTime = new Date(entry.update_time * 1000);
        dateContainer.innerHTML = updateTime.getFullYear() + '年';
        appendChild(dateContainer, createElement('br'));
        dateContainer.innerHTML += (updateTime.getMonth() + 1) + '月' + updateTime.getDate() + '日';

        let titleContainer = createElement('div');
        titleContainer.innerHTML = entry.title;
        addClass(titleContainer, 'overview-title');
        addClass(titleContainer, 'ellipsis-clipping-2');

        appendChild(overviewContainer, dateContainer);
        appendChild(overviewContainer, titleContainer);

        addEventListener(overviewContainer, 'click', function () {
            redirect(DEVELOPMENT ? ('news.html?id=' + entry.id) : (NEWS_TOP_URL + entry.id));
        });

        appendChild(getById('main'), overviewContainer);
    }
    offset = allNewsInfo[allNewsInfo.length - 1] as AllNewsInfo.OffsetInfo;

    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

function getDayOfWeek(date: Date): string {
    const index = date.getDay();
    var result: string;
    switch (index) {
        case 1:
            result = '月';
            break;
        case 2:
            result = '火';
            break;
        case 3:
            result = '水';
            break;
        case 4:
            result = '木';
            break;
        case 5:
            result = '金';
            break;
        case 6:
            result = '土';
            break;
        default:
            result = '日';
    }
    return result;
}