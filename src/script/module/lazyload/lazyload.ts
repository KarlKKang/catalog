// JavaScript Document
import 'intersection-observer';
import {
    sendServerRequest,
    concatenateSignedURL,
} from '../main';
import {
    getByClass,
    addClass,
    getDataAttribute,
    setDataAttribute,
} from '../dom';
import { show as showMessage } from '../message';
import { invalidResponse } from '../message/template/param/server';
import * as CDNCredentials from '../type/CDNCredentials';
import type ImageLoader from '../image_loader';

const observer = new IntersectionObserver(observerCallback, {
    root: null,
    rootMargin: '50% 0px 50% 0px',
    threshold: [0]
});

enum Status {
    LISTENING,
    WAITING,
    LOADING,
    COMPLETE,
    ERROR,
}

let loader: typeof ImageLoader;
export default function (imageLoader: typeof ImageLoader) {
    loader = imageLoader;

    const elems = getByClass('lazyload');
    for (const elem of elems) {
        if (getStatusAttr(elem) === null) {
            observer.observe(elem);
            setStatusAttr(elem, Status.LISTENING);
        }
    }
}

const requests: (XMLHttpRequest | undefined)[] = [];
function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    for (const entry of entries) {
        const target = entry.target;

        if (entry['isIntersecting']) {
            if (getStatusAttr(target) === Status.LISTENING) {
                setStatusAttr(target, Status.WAITING);
                let delay = 0;
                const delayStr = getDataAttribute(target, 'lazyload-delay');
                if (delayStr !== null) {
                    delay = parseInt(delayStr, 10);
                    if (isNaN(delay)) {
                        delay = 0;
                    }
                }
                setTimeout(function () {
                    if (getStatusAttr(target) !== Status.WAITING) {
                        return;
                    }

                    setStatusAttr(target, Status.LOADING);

                    const requestIndex = requests.length;
                    setRequestIndexAttr(target, requestIndex);
                    function onload() {
                        observer.unobserve(target);
                        requests[requestIndex] = undefined;
                        addClass(target, 'complete');
                        setStatusAttr(target, Status.COMPLETE);
                    }
                    function onerror() {
                        observer.unobserve(target);
                        requests[requestIndex] = undefined;
                        setStatusAttr(target, Status.ERROR);
                    }

                    const src = getDataAttribute(target, 'src');
                    if (src === null) {
                        throw new Error('The "src" attribute is missing on the lazyload element.');
                    }
                    const altAttr = getDataAttribute(target, 'alt');
                    const alt = altAttr === null ? src : altAttr;
                    const xhrParam = getDataAttribute(target, 'xhr-param');
                    if (xhrParam !== null) {
                        const mediaSessionCredential = getDataAttribute(target, 'media-session-credential');
                        let uri = 'get_image.php';
                        let content = 'p=' + xhrParam;
                        if (mediaSessionCredential === null) {
                            uri = 'get_news_image.php';
                        } else {
                            content = mediaSessionCredential + '&' + content;
                        }

                        requests[requestIndex] = sendServerRequest(uri, {
                            callback: function (response: string) {
                                let credentials: CDNCredentials.CDNCredentials;
                                try {
                                    credentials = JSON.parse(response);
                                    CDNCredentials.check(credentials);
                                } catch (e) {
                                    showMessage(invalidResponse);
                                    return;
                                }

                                const url = concatenateSignedURL(src, credentials);
                                requests[requestIndex] = loader(target, url, alt, onload, onerror);
                            },
                            content: content
                        });
                    } else {
                        requests[requestIndex] = loader(target, src, alt, onload, onerror);
                    }
                }, delay);
            }
        } else {
            const status = getStatusAttr(target);
            if (status === Status.WAITING) {
                setStatusAttr(target, Status.LISTENING);
            } else if (status === Status.LOADING) {
                const requestIndex = getRequestIndexAttr(target);
                if (requestIndex !== null) {
                    const request = requests[requestIndex];
                    if (request !== undefined) {
                        if (request.readyState === 4) { // onload for the imageLoader may be called after decoding webp.
                            continue;
                        } else {
                            request.abort();
                            requests[requestIndex] = undefined;
                        }
                    }
                }
                setStatusAttr(target, Status.LISTENING);
            }
        }
    }

}

const STATUS_ATTR_NAME = 'lazyload-status';
function setStatusAttr(elem: Element, status: number) {
    setDataAttribute(elem, STATUS_ATTR_NAME, status.toString());
}
function getStatusAttr(elem: Element) {
    const statusStr = getDataAttribute(elem, STATUS_ATTR_NAME);
    if (statusStr === null) {
        return null;
    }
    const status = parseInt(statusStr, 10);
    if (!(status in Status)) {
        setStatusAttr(elem, Status.LISTENING);
        return Status.LISTENING;
    }
    return status;
}

const REQUEST_INDEX_ATTR_NAME = 'lazyload-req-index';
function setRequestIndexAttr(elem: Element, index: number) {
    setDataAttribute(elem, REQUEST_INDEX_ATTR_NAME, index.toString());
}
function getRequestIndexAttr(elem: Element) {
    const indexStr = getDataAttribute(elem, REQUEST_INDEX_ATTR_NAME);
    if (indexStr === null) {
        return null;
    }
    return parseInt(indexStr, 10);
}