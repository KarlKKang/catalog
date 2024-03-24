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
import {
    addEventListener,
    addClass,
    appendChild,
    getDescendantsByClass,
    getDataAttribute,
    containsClass,
    createDivElement,
    createParagraphElement,
    removeAllEventListeners,
    body,
    removeClass,
    setTitle,
    getTitle,
} from '../module/dom';
import { showMessage } from '../module/message';
import { notFound } from '../module/server/message';
import * as NewsInfo from '../module/type/NewsInfo';
import { encodeCFURIComponent } from '../module/common/pure';
import { pgid, redirect } from '../module/global';
import { lazyloadImport, unloadLazyload } from '../module/lazyload';
import { loading } from '../module/text/ui';
import * as styles from '../../css/news.module.scss';
import { addManualAllLanguageClass } from '../module/dom/create_element/all_language';
import { createNewsTemplate, parseNewsStyle } from '../module/news';
import { NEWS_TOP_URL } from './helper';

const INTERNAL_IMAGE_CLASS = 'image-internal';
const IMAGE_ENLARGE_CLASS = 'image-enlarge';

export default function (newsInfo: NewsInfo.NewsInfo, lazyloadImportPromise: ReturnType<typeof lazyloadImport>, newsID: string): void {
    setTitle(newsInfo.title + ' | ' + getTitle());

    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    const loadingText = createParagraphElement(loading);
    addClass(loadingText, styles.loadingText);
    appendChild(contentContainer, loadingText);

    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const [contentOuterContainer, contentInnerContainer] = createNewsTemplate(newsInfo.title, newsInfo.create_time, newsInfo.update_time);
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
            addManualAllLanguageClass(contentContainer);
            bindEventListners(contentContainer);
            attachImage(lazyloadImportPromise, contentContainer, newsID, newsInfo.credential);
            parseNewsStyle(contentContainer);
            scrollToHash();
        } else {
            showMessage(notFound);
        }
    });

    xhr.send();
}

async function attachImage(lazyloadImportPromise: ReturnType<typeof lazyloadImport>, contentContainer: HTMLElement, newsID: string, credential: string): Promise<void> {
    const currentPgid = pgid;
    const lazyload = await lazyloadImportPromise;
    if (currentPgid !== pgid) {
        return;
    }
    lazyload.setCredential(credential, SessionTypes.NEWS);

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
        lazyload.default(elem, baseURL + encodeCFURIComponent(src), src, { delay: 250 });
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
    unloadLazyload();
}