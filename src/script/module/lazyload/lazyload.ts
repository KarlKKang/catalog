// JavaScript Document
import 'intersection-observer';
import {
    sendServerRequest,
    concatenateSignedURL,
} from '../main';
import {
    getByClass,
    containsClass,
    addClass,
    getDataAttribute,
} from '../dom';
import { show as showMessage } from '../message';
import { invalidResponse } from '../message/template/param/server';
import * as CDNCredentials from '../type/CDNCredentials';
import type ImageLoader from '../image_loader';

let loader: typeof ImageLoader;
export default function (imageLoader: typeof ImageLoader) {
    loader = imageLoader;

    const elems = getByClass('lazyload');
    const options = {
        root: null,
        rootMargin: '0px 0px 50% 0px',
        threshold: [0]
    };

    for (const elem of elems) {
        if (elem instanceof HTMLElement && !containsClass(elem, 'listening')) {
            const observer = new IntersectionObserver(observerCallback, options);
            observer.observe(elem);
            addClass(elem, 'listening');
        }
    }
}

function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    const entry = entries[0];
    if (entry === undefined) {
        throw new Error('IntersectionObserverEntry is undefined.');
    }
    const target = entry.target;

    if (entry['isIntersecting'] === true) {
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
                    });
                },
                content: content
            });
        } else {
            loader(target, src, alt, function () {
                addClass(target, 'complete');
            });
        }
    }
}