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
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { AllNewsInfo, NewsInfo } from './module/type';
import initializeInfiniteScrolling from './module/infinite_scrolling';

const NEWS_TOP_URL = TOP_URL + '/news';
var offset: AllNewsInfo.OffsetInfo = 0;
var infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>;

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (!getHref().startsWith(NEWS_TOP_URL) && !DEVELOPMENT) {
        redirect(NEWS_TOP_URL, true);
        return;
    }

    const newsID = getNewsID();
    if (newsID === null) {
        infiniteScrolling = initializeInfiniteScrolling(getAllNews);
        getAllNews();
    } else if (/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        getNews(newsID);
    } else {
        redirect(NEWS_TOP_URL, true);
        return;
    }
});

function getNewsID(): string | null {
    var url = getHref() + '?';
    if (url.startsWith(TOP_URL + '/news/')) {
        var start = (TOP_URL + '/news/').length;
        var end = url.indexOf('?');
        if (start == end) {
            return null;
        }
        return url.slice(start, end);
    } else {
        return getURLParam('id');
    }
}

function getNews(newsID: string): void {
    sendServerRequest('get_news.php', {
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
            scrollToHash();
        },
        content: 'id=' + newsID,
        logoutParam: 'news=' + newsID
    });
}

function showNews(newsInfo: NewsInfo.NewsInfo): void {
    let outerContainer = createElement('div');
    let container = createElement('div');
    container.id = 'content-container';

    let titleContainer = createElement('p');
    titleContainer.id = 'title';

    titleContainer.innerHTML = newsInfo.title;
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
}

function getAllNews(): void {
    if (offset === 'EOF') {
        return;
    }

    sendServerRequest('get_news.php', {
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
            redirect(DEVELOPMENT ? ('news.html?id=' + entry.id) : (NEWS_TOP_URL + '/' + entry.id));
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