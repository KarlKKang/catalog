import { sendServerRequest } from '../module/server';
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
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { getInfiniteScrolling, initializeInfiniteScrolling, destroy as destroyInfiniteScrolling } from '../module/infinite_scrolling';
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
    initializeInfiniteScrolling(positionDetector, () => { getAllNews(container, loadingTextContainer); });
    showAllNews(container, allNewsInfo, loadingTextContainer);
}

function getAllNews(container: HTMLElement, loadingTextContainer: HTMLElement): void {
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
            showAllNews(container, parsedResponse, loadingTextContainer);
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
    const infiniteScrolling = getInfiniteScrolling();
    infiniteScrolling.setEnabled(true);
    infiniteScrolling.updatePosition();
}

export function offload() {
    destroyInfiniteScrolling();
}