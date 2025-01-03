import {
    openImageWindow,
} from '../module/image/open_window';
import { ImageSessionTypes } from '../module/image/session_type';
import { removeRightClick } from '../module/dom/element/remove_right_click';
import { newXhr } from '../module/xhr/new';
import { scrollToHash } from '../module/dom/scroll/to_hash';
import { setTitle } from '../module/dom/document/title';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { getByClass } from '../module/dom/element/get/by_class';
import { appendChild } from '../module/dom/node/append_child';
import { getDataAttribute } from '../module/dom/attr/data/get';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { buildURI } from '../module/string/uri/build';
import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { buildHttpForm } from '../module/string/http_form/build';
import { addOffloadCallback } from '../module/global/offload';
import { redirectSameOrigin } from '../module/global/redirect';
import { loading } from '../module/text/search/loading';
import * as styles from '../../css/news.module.scss';
import { link as linkClass } from '../../css/link.module.scss';
import { parseNewsStyle } from '../module/news/parse_style';
import { createNewsContainer } from '../module/news/create_container';
import { NewsInfoKey, type NewsInfo } from '../module/type/NewsInfo';
import { attachLazyload, setLazyloadCredential, offload as offloadLazyload } from '../module/lazyload';
import { addManualMultiLanguageClass } from '../module/style/multi_language/manual';
import { getCDNOrigin } from '../module/env/location/get/origin/cdn';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI } from '../module/env/uri';
import { addTimeout } from '../module/timer/add/timeout';
import { getHighResTimestamp, type HighResTimestamp } from '../module/time/hi_res';
import { mediaLoadError } from '../module/message/param/media_load_error';
import { setOgUrl } from '../module/dom/document/og/url/set';

export default function (newsInfo: NewsInfo, newsID: string, startTime: HighResTimestamp): void {
    setOgUrl(NEWS_ROOT_URI + newsID);
    const title = newsInfo[NewsInfoKey.TITLE];
    setTitle(title);

    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    const loadingText = createParagraphElement(loading);
    addClass(loadingText, styles.loadingText);
    appendChild(contentContainer, loadingText);

    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const [contentOuterContainer, contentInnerContainer] = createNewsContainer(title, newsInfo[NewsInfoKey.CREATE_TIME], newsInfo[NewsInfoKey.UPDATE_TIME] ?? null);
    appendChild(contentInnerContainer, contentContainer);
    appendChild(container, contentOuterContainer);

    getNewsContent(newsInfo, newsID, startTime, contentContainer);
}

function getNewsContent(newsInfo: NewsInfo, newsID: string, startTime: HighResTimestamp, contentContainer: HTMLElement, retryCount = 3, retryTimeout = 500): void {
    const errorMessage = mediaLoadError(NEWS_ROOT_URI);
    if (getHighResTimestamp() - startTime >= 30000) {
        showMessage(errorMessage);
        return;
    }
    const retry = () => {
        retryCount--;
        if (retryCount < 0) {
            showMessage(errorMessage);
            return;
        }
        addTimeout(() => {
            getNewsContent(newsInfo, newsID, startTime, contentContainer, retryCount, retryTimeout * 2);
        }, retryTimeout);
    };
    const xhr = newXhr(
        getCDNOrigin() + '/news/' + newsID + '.html',
        'GET',
        true,
        () => {
            if (xhr.status === 200) {
                contentContainer.innerHTML = xhr.responseText;
                addManualMultiLanguageClass(contentContainer);
                bindEventListners(contentContainer);
                attachImage(contentContainer, newsID, newsInfo[NewsInfoKey.CREDENTIAL]);
                parseNewsStyle(contentContainer);
                scrollToHash();
            } else {
                retry();
            }
        },
    );
    addEventListener(xhr, 'error', retry);
    xhr.send();
}

async function attachImage(contentContainer: HTMLElement, newsID: string, credential: string): Promise<void> {
    addOffloadCallback(offloadLazyload);
    setLazyloadCredential(credential, ImageSessionTypes.NEWS);

    const baseURL = getCDNOrigin() + '/news/' + newsID + '/';
    const INTERNAL_IMAGE_CLASS = 'image-internal';
    const elems = getByClass(contentContainer, INTERNAL_IMAGE_CLASS);
    let elem = elems[0];
    while (elem !== undefined) {
        removeClass(elem, INTERNAL_IMAGE_CLASS);
        addClass(elem, styles.imageInternal);
        const src = getDataAttribute(elem, 'src');
        if (src === null) {
            continue;
        }
        attachLazyload(elem, baseURL + encodeCloudfrontURIComponent(src), src, 250);
        addEventListener(elem, 'click', () => {
            openImageWindow(baseURL, src, credential, ImageSessionTypes.NEWS, NEWS_ROOT_URI + newsID);
        });
        removeRightClick(elem);
        elem = elems[0];
    }
}

function bindEventListners(contentContainer: HTMLElement): void {
    const INTERNAL_LINK_CLASS = 'link-internal';
    const elems = getByClass(contentContainer, INTERNAL_LINK_CLASS);
    let elem = elems[0];
    while (elem !== undefined) {
        removeClass(elem, INTERNAL_LINK_CLASS);
        addClass(elem, linkClass);
        const internalLink = getInternalLink(elem);
        addEventListener(elem, 'click', () => {
            if (internalLink !== null) {
                redirectSameOrigin(internalLink);
            }
        });
        elem = elems[0];
    }
}

function getInternalLink(elem: Element): string | null {
    const page = getDataAttribute(elem, 'page');

    if (page === 'news') {
        const newsID = getDataAttribute(elem, 'news-id');
        if (newsID === null) {
            return null;
        }
        return NEWS_ROOT_URI + newsID;
    }

    if (page === 'bangumi') {
        const seriesID = getDataAttribute(elem, 'series-id');
        if (seriesID === null) {
            return null;
        }
        const epIndex = getDataAttribute(elem, 'ep-index');
        const formatIndex = getDataAttribute(elem, 'format-index');
        return buildURI(
            BANGUMI_ROOT_URI + seriesID + '/' + (epIndex ?? '1'),
            buildHttpForm({
                ...formatIndex !== '1' && { format: formatIndex },
            }),
        );
    }

    return null;
}
