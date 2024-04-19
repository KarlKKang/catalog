import {
    CDN_URL,
    TOP_URL,
} from '../module/env/constant';
import {
    scrollToHash,
    removeRightClick,
    openImageWindow,
    SessionTypes,
} from '../module/common';
import { getTitle, setTitle } from '../module/dom/document';
import { createDivElement, createParagraphElement } from '../module/dom/create_element';
import { addClass, appendChild, containsClass, getDataAttribute, getDescendantsByClass, removeClass } from '../module/dom/element';
import { body } from '../module/dom/body';
import { addEventListener, removeAllEventListeners } from '../module/event_listener';
import { showMessage } from '../module/message';
import { notFound } from '../module/server/message';
import { encodeCFURIComponent } from '../module/common/pure';
import { redirect } from '../module/global';
import { loading } from '../module/text/ui';
import * as styles from '../../css/news.module.scss';
import { createNewsTemplate, parseNewsStyle } from '../module/news';
import { NEWS_TOP_URL } from './helper';
import { NewsInfoKey, type NewsInfo } from '../module/type/NewsInfo';
import { attachLazyload, setLazyloadCredential, offload as offloadLazyload } from '../module/lazyload';
import { addManualMultiLanguageClass } from '../module/dom/create_element/multi_language';

const INTERNAL_IMAGE_CLASS = 'image-internal';
const IMAGE_ENLARGE_CLASS = 'image-enlarge';

export default function (newsInfo: NewsInfo, newsID: string): void {
    const title = newsInfo[NewsInfoKey.TITLE];
    setTitle(title + ' | ' + getTitle());

    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    const loadingText = createParagraphElement(loading);
    addClass(loadingText, styles.loadingText);
    appendChild(contentContainer, loadingText);

    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const [contentOuterContainer, contentInnerContainer] = createNewsTemplate(title, newsInfo[NewsInfoKey.CREATE_TIME], newsInfo[NewsInfoKey.UPDATE_TIME] ?? null);
    appendChild(contentInnerContainer, contentContainer);
    appendChild(container, contentOuterContainer);

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
            addManualMultiLanguageClass(contentContainer);
            bindEventListners(contentContainer);
            attachImage(contentContainer, newsID, newsInfo[NewsInfoKey.CREDENTIAL]);
            parseNewsStyle(contentContainer);
            scrollToHash();
        } else {
            showMessage(notFound);
        }
    });

    xhr.send();
}

async function attachImage(contentContainer: HTMLElement, newsID: string, credential: string): Promise<void> {
    setLazyloadCredential(credential, SessionTypes.NEWS);

    const baseURL = CDN_URL + '/news/' + newsID + '/';
    const elems = getDescendantsByClass(contentContainer, INTERNAL_IMAGE_CLASS);
    let elem = elems[0];
    while (elem !== undefined) {
        removeClass(elem, INTERNAL_IMAGE_CLASS);
        addClass(elem, styles.imageInternal);
        const src = getDataAttribute(elem, 'src');
        if (src === null) {
            continue;
        }
        attachLazyload(elem, baseURL + encodeCFURIComponent(src), src, 250);
        if (containsClass(elem, IMAGE_ENLARGE_CLASS)) {
            removeClass(elem, IMAGE_ENLARGE_CLASS);
            addClass(elem, styles.imageEnlarge);
            addEventListener(elem, 'click', () => {
                openImageWindow(baseURL, src, credential, SessionTypes.NEWS);
            });
        }
        removeRightClick(elem);
        elem = elems[0];
    }
}

function bindEventListners(contentContainer: HTMLElement): void {
    const elems = getDescendantsByClass(contentContainer, 'open-window');
    for (const elem of (elems as HTMLCollectionOf<HTMLElement>)) {
        removeClass(elem, 'open-window');
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

export function offload() {
    offloadLazyload();
}