import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { appendText, createBRElement, createDivElement, createParagraphElement, replaceText } from '../module/dom/create_element';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from '../module/infinite_scrolling';
import { TimeInfoKey, getLocalTime, padTime } from '../module/time';
import { buildURLForm } from '../module/http_form';
import { redirect } from '../module/global';
import { allResultsShown, loading, noResult } from '../module/text/ui';
import * as styles from '../../css/news.module.scss';
import { lineClamp as lineClampClass } from '../../css/line_clamp.module.scss';
import { type AllNewsInfo, parseAllNewsInfo, type Pivot, AllNewsInfoKey, AllNewsInfoEntryKey } from '../module/type/AllNewsInfo';
import { NEWS_ROOT_URI } from '../module/env/uri';

let pivot: Pivot;

export default function (allNewsInfo: AllNewsInfo) {
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
    sendServerRequest('get_all_news', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            showAllNews(parseResponse(response, parseAllNewsInfo), container, loadingTextContainer, infiniteScrolling);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ pivot: pivot }),
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function showAllNews(allNewsInfo: AllNewsInfo, container: HTMLElement, loadingTextContainer: HTMLElement, infiniteScrolling: ReturnType<typeof initializeInfiniteScrolling>): void {
    const newPivot = allNewsInfo[AllNewsInfoKey.PIVOT];
    const allNewsInfoEntries = allNewsInfo[AllNewsInfoKey.NEWS];

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
        const updateTime = getLocalTime(entry[AllNewsInfoEntryKey.UPDATE_TIME]);
        appendText(dateContainer, updateTime[TimeInfoKey.YEAR] + '年');
        appendChild(dateContainer, createBRElement());
        appendText(dateContainer, padTime(updateTime[TimeInfoKey.MONTH]) + '月' + padTime(updateTime[TimeInfoKey.DATE]) + '日');

        const titleContainer = createDivElement();
        appendText(titleContainer, entry[AllNewsInfoEntryKey.TITLE]);
        addClass(titleContainer, styles.overviewTitle);
        addClass(titleContainer, lineClampClass);

        appendChild(overviewContainer, dateContainer);
        appendChild(overviewContainer, titleContainer);

        addEventListener(overviewContainer, 'click', () => {
            redirect(NEWS_ROOT_URI + entry[AllNewsInfoEntryKey.ID]);
        });

        appendChild(container, overviewContainer);
    }
    infiniteScrolling[InfiniteScrollingProp.SET_ENABLED](true);
    infiniteScrolling[InfiniteScrollingProp.UPDATE_POSITION]();
}
