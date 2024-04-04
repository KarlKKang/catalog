import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import {
    addEventListener,
    addClass,
    appendChild,
    createDivElement,
    createBRElement,
    appendText,
    replaceText,
    body,
    createParagraphElement,
} from '../module/dom';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from '../module/infinite_scrolling';
import { getLocalTime } from '../module/common/pure';
import { redirect } from '../module/global';
import { allResultsShown, loading, noResult } from '../module/text/ui';
import * as styles from '../../css/news.module.scss';
import { lineClamp as lineClampClass } from '../../css/line_clamp.module.scss';
import { NEWS_TOP_URL } from './helper';

let pivot: AllNewsInfo.PivotInfo;

export default function (allNewsInfo: AllNewsInfo.AllNewsInfo) {
    pivot = 0;
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);
    const loadingTextContainer = createParagraphElement();
    addClass(loadingTextContainer, styles.loadingText);
    appendChild(body, loadingTextContainer);
    const positionDetector = createDivElement();
    appendChild(body, positionDetector);
    const infiniteScrolling = initializeInfiniteScrolling(positionDetector, () => {
        getAllNews(container, loadingTextContainer, infiniteScrolling);
    });
    showAllNews(allNewsInfo, container, loadingTextContainer, infiniteScrolling);
}

function getAllNews(container: HTMLElement, loadingTextContainer: HTMLElement, infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>): void {
    if (pivot === 'EOF') {
        return;
    }
    sendServerRequest('get_all_news?pivot=' + pivot, {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            showAllNews(parseResponse(response, AllNewsInfo.parseAllNewsInfo), container, loadingTextContainer, infiniteScrolling);
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function showAllNews(allNewsInfo: AllNewsInfo.AllNewsInfo, container: HTMLElement, loadingTextContainer: HTMLElement, infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>): void {
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
        addClass(overviewContainer, styles.overviewContainer);

        const dateContainer = createDivElement();
        addClass(dateContainer, styles.date);
        const updateTime = getLocalTime(entry.update_time);
        appendText(dateContainer, updateTime.year + '年');
        appendChild(dateContainer, createBRElement());
        appendText(dateContainer, updateTime.month.toString().padStart(2, '0') + '月' + updateTime.date.toString().padStart(2, '0') + '日');

        const titleContainer = createDivElement();
        appendText(titleContainer, entry.title);
        addClass(titleContainer, styles.overviewTitle);
        addClass(titleContainer, lineClampClass);

        appendChild(overviewContainer, dateContainer);
        appendChild(overviewContainer, titleContainer);

        addEventListener(overviewContainer, 'click', () => {
            redirect(NEWS_TOP_URL + entry.id);
        });

        appendChild(container, overviewContainer);
    }
    infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](true);
    infiniteScrolling[InfiniteScrollingProp.UPDATE_POSITION]();
}