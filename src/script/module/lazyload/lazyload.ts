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
    rootMargin: '25% 0px 25% 0px',
    threshold: [0]
});

const STATUS_ATTR_NAME = 'lazyload-status';

let loader: typeof ImageLoader;
export default function (imageLoader: typeof ImageLoader) {
    loader = imageLoader;

    const elems = getByClass('lazyload');
    for (const elem of elems) {
        if (getDataAttribute(elem, STATUS_ATTR_NAME) === null) {
            observer.observe(elem);
            setDataAttribute(elem, STATUS_ATTR_NAME, 'listening');
        }
    }
}

function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    for (const entry of entries) {
        const target = entry.target;

        if (entry['isIntersecting']) {
            if (getDataAttribute(target, STATUS_ATTR_NAME) === 'listening') {
                setDataAttribute(target, STATUS_ATTR_NAME, 'loading');
                setTimeout(function () {
                    if (getDataAttribute(target, STATUS_ATTR_NAME) !== 'loading') {
                        return;
                    }

                    observer.unobserve(target);

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
                        sendServerRequest(uri, {
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
                                loader(target, url, alt, function () {
                                    addClass(target, 'complete');
                                    setDataAttribute(target, STATUS_ATTR_NAME, 'complete');
                                });
                            },
                            content: content
                        });
                    } else {
                        loader(target, src, alt, function () {
                            addClass(target, 'complete');
                            setDataAttribute(target, STATUS_ATTR_NAME, 'complete');
                        });
                    }
                }, 250);
            }
        } else {
            if (getDataAttribute(target, STATUS_ATTR_NAME) === 'loading') {
                setDataAttribute(target, STATUS_ATTR_NAME, 'listening');
            }
        }
    }

}