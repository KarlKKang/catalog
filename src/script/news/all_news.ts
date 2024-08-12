import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createBRElement } from '../module/dom/element/br/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { initializeInfiniteScrolling, InfiniteScrollingProp } from '../module/infinite_scrolling';
import { padNumberLeft } from '../module/string/pad_number_left';
import { TimeInfoKey, getLocalTime } from '../module/time/local';
import { buildHttpForm } from '../module/string/http_form/build';
import { redirect } from '../module/global';
import { noResult } from '../module/text/search/no_result';
import { allResultsShown } from '../module/text/search/all_results_shown';
import { loading } from '../module/text/search/loading';
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
        [ServerRequestOptionKey.CALLBACK]: function (response: string) {
            showAllNews(parseResponse(response, parseAllNewsInfo), container, loadingTextContainer, infiniteScrolling);
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ pivot: pivot }),
        [ServerRequestOptionKey.METHOD]: 'GET',
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
        appendText(dateContainer, padNumberLeft(updateTime[TimeInfoKey.MONTH], 2) + '月' + padNumberLeft(updateTime[TimeInfoKey.DATE], 2) + '日');

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
