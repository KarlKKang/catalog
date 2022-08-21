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
} from '../DOM';
import { show as showMessage } from '../message';
import { lazyloadSrcMissing, javascriptError } from '../message/template/param';
import { invalidResponse } from '../message/template/param/server';
import { CDNCredentials } from '../type';
import type ImageLoader from '../image_loader';

var loader: typeof ImageLoader;
export default function (imageLoader: typeof ImageLoader) {
    loader = imageLoader;

    var elems = getByClass('lazyload');
    const options = {
        root: null,
        rootMargin: '0px 0px 50% 0px',
        threshold: [0]
    };

    for (let elem of elems) {
        if (elem instanceof HTMLElement && !containsClass(elem, 'listening')) {
            let observer = new IntersectionObserver(observerCallback, options);
            observer.observe(elem);
            addClass(elem, 'listening');
        }
    }
}

function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    const entry = entries[0];
    if (entry === undefined) {
        showMessage(javascriptError('IntersectionObserverEntry is undefined.'));
        return;
    }
    const target = entry.target as HTMLElement;

    if (entry['isIntersecting'] === true) {
        observer.unobserve(target);

        const src = getDataAttribute(target, 'src');
        if (src === null) {
            showMessage(lazyloadSrcMissing);
            return;
        }

        const altAttr = getDataAttribute(target, 'alt');
        const alt = altAttr === null ? src : altAttr;

        const authenticationToken = getDataAttribute(target, 'authentication-token');

        if (authenticationToken !== null) {
            const xhrParam = getDataAttribute(target, 'xhr-param');
            if (xhrParam === null) {
                showMessage(javascriptError('xhrParam is null.'));
                return;
            }
            sendServerRequest('get_image.php', {
                callback: function (response: string) {
                    var credentials: CDNCredentials.CDNCredentials;
                    try {
                        var parsedResponse: any = JSON.parse(response);
                        CDNCredentials.check(parsedResponse);
                        credentials = parsedResponse as CDNCredentials.CDNCredentials;
                    } catch (e) {
                        showMessage(invalidResponse);
                        return;
                    }

                    const url = concatenateSignedURL(src, credentials);
                    loader(target, url, alt, function () {
                        addClass(target, 'complete');
                    });
                },
                content: "token=" + authenticationToken + "&p=" + xhrParam
            });
        } else {
            loader(target, src, alt, function () {
                addClass(target, 'complete');
            });
        }
    }
}