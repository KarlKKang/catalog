// JavaScript Document
import 'intersection-observer';
import {
    sendServerRequest,
} from '../main';
import {
    addClass,
} from '../dom';
import { show as showMessage } from '../message';
import { invalidResponse } from '../message/template/param/server';

const observer = new IntersectionObserver(observerCallback, {
    root: null,
    rootMargin: '50% 0px 50% 0px',
    threshold: [0]
});

const enum Status {
    LISTENING,
    WAITING,
    LOADING,
}

type TargetData = {
    src: string;
    alt: string;
    xhrParam: string | null;
    mediaSessionCredential: string | null;
    delay: number;
    onDataLoad: ((data: Blob) => void) | undefined;
    status: Status;
    xhr: XMLHttpRequest | null;
};

const targets: WeakMap<Element, TargetData> = new WeakMap();

const imageLoaderImportPromise = import(
    /* webpackExports: ["default"] */
    '../image_loader'
);

export default function (
    target: Element,
    src: string,
    alt: string,
    options?: {
        xhrParam?: string;
        mediaSessionCredential?: string;
        delay?: number;
        onDataLoad?: (data: Blob) => void;
    }
) {
    if (options === undefined) {
        options = {};
    }

    observer.observe(target);
    targets.set(target, {
        src: src,
        alt: alt,
        xhrParam: options.xhrParam || null,
        mediaSessionCredential: options.mediaSessionCredential || null,
        delay: options.delay || 0,
        onDataLoad: options.onDataLoad,
        status: Status.LISTENING,
        xhr: null
    });
}

function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    for (const entry of entries) {
        const target = entry.target;
        const targetData = targets.get(target);
        if (targetData === undefined) {
            throw new Error('Cannot find lazyload target data.');
        }

        if (entry['isIntersecting']) {
            if (targetData.status === Status.LISTENING) {
                targetData.status = Status.WAITING;
                setTimeout(async () => {
                    if (targetData.status !== Status.WAITING) {
                        return;
                    }

                    targetData.status = Status.LOADING;

                    const onImageDraw = () => {
                        observer.unobserve(target);
                        targets.delete(target);
                        addClass(target, 'complete');
                    };
                    const onError = () => {
                        observer.unobserve(target);
                        targets.delete(target);
                    };

                    if (targetData.xhrParam !== null) {
                        let uri = 'get_image';
                        let content = targetData.xhrParam;
                        if (targetData.mediaSessionCredential === null) {
                            uri = 'get_news_image';
                        } else {
                            content = targetData.mediaSessionCredential + '&' + content;
                        }

                        targetData.xhr = sendServerRequest(uri, {
                            callback: async function (response: string) {
                                if (response !== 'APPROVED') {
                                    showMessage(invalidResponse);
                                    return;
                                }

                                targetData.xhr = (await imageLoaderImportPromise).default(target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onError);
                            },
                            content: content
                        });
                    } else {
                        targetData.xhr = (await imageLoaderImportPromise).default(target, targetData.src, targetData.alt, false, onImageDraw, targetData.onDataLoad, onError);
                    }
                }, targetData.delay);
            }
        } else {
            if (targetData.status === Status.WAITING) {
                targetData.status = Status.LISTENING;
            } else if (targetData.status === Status.LOADING) {
                if (targetData.xhr !== null) {
                    if (targetData.xhr.readyState === 4) { // onImageDraw for the imageLoader may be called after decoding webp.
                        continue;
                    } else {
                        targetData.xhr.abort();
                        targetData.xhr = null;
                    }
                }
                targetData.status = Status.LISTENING;
            }
        }
    }
}