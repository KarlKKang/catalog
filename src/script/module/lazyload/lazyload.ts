import 'intersection-observer';
import {
    sendServerRequest,
} from '../common';
import {
    addClass,
} from '../dom';
import { show as showMessage } from '../message';
import { invalidResponse } from '../message/template/param/server';
import { addTimeout } from '../timer';
import type { default as ImageLoader } from '../image_loader';

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

const targets: Map<Element, TargetData> = new Map();
let mediaSessionCredentialPromise: Promise<void> | null = null;
let newsSessionCredentialPromise: Promise<void> | null = null;

let imageLoader: typeof ImageLoader;

export function attachImageLoader(loader: typeof ImageLoader) {
    imageLoader = loader;
}

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
                addTimeout(() => {
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
                        const mediaSessionCredential = targetData.mediaSessionCredential;
                        const isMediaSession = mediaSessionCredential !== null;
                        const uri = isMediaSession ? 'get_image' : 'get_news_image';
                        const content = (isMediaSession ? (mediaSessionCredential + '&') : '') + targetData.xhrParam;

                        const credentialPromise = isMediaSession ? mediaSessionCredentialPromise : newsSessionCredentialPromise;
                        if (credentialPromise === null) {
                            setCredentialPromise(isMediaSession, new Promise((resolve) => {
                                targetData.xhr = sendServerRequest(uri, {
                                    callback: function (response: string) {
                                        if (response !== 'APPROVED') {
                                            showMessage(invalidResponse());
                                            return;
                                        }
                                        addTimeout(() => {
                                            setCredentialPromise(isMediaSession, null);
                                        }, 15 * 1000);
                                        resolve();
                                        imageLoader(target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onError);
                                    },
                                    content: content,
                                    showSessionEndedMessage: true,
                                });
                            }));
                        } else {
                            credentialPromise.then(() => {
                                imageLoader(target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onError);
                            });
                        }
                    } else {
                        imageLoader(target, targetData.src, targetData.alt, false, onImageDraw, targetData.onDataLoad, onError);
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

function setCredentialPromise(isMediaSession: boolean, requestPromise: Promise<void> | null) {
    if (isMediaSession) {
        mediaSessionCredentialPromise = requestPromise;
    } else {
        newsSessionCredentialPromise = requestPromise;
    }
}

export function unobserveAll() {
    observer.disconnect();
    targets.clear();
    mediaSessionCredentialPromise = null;
    newsSessionCredentialPromise = null;
}