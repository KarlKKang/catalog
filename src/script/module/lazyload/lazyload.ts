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

function observerCallback(entries: IntersectionObserverEntry[]) {
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
                    if (!targets.has(target) || targetData.status !== Status.WAITING) {
                        return;
                    }
                    targetData.status = Status.LOADING;
                    loadImage(target, targetData);
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

function loadImage(target: Element, targetData: TargetData) {
    const onImageDraw = () => {
        observer.unobserve(target);
        targets.delete(target);
        addClass(target, 'complete');
    };
    const onUnrecoverableError = () => {
        observer.unobserve(target);
        targets.delete(target);
    };
    const onNetworkError = () => {
        addTimeout(() => {
            if (targets.has(target) && targetData.status === Status.LOADING) {
                loadImage(target, targetData);
            }
        }, 5000);
    };

    if (targetData.xhrParam !== null) {
        const mediaSessionCredential = targetData.mediaSessionCredential;
        const isMediaSession = mediaSessionCredential !== null;
        const uri = isMediaSession ? 'get_image' : 'get_news_image';
        const content = (isMediaSession ? (mediaSessionCredential + '&') : '') + targetData.xhrParam;

        let credentialPromise = isMediaSession ? mediaSessionCredentialPromise : newsSessionCredentialPromise;
        if (credentialPromise === null) {
            credentialPromise = new Promise((resolve) => {
                sendServerRequest(uri, {
                    callback: function (response: string) {
                        if (response !== 'APPROVED') {
                            showMessage(invalidResponse());
                            return;
                        }
                        addTimeout(() => {
                            setCredentialPromise(isMediaSession, null);
                        }, 15 * 1000);
                        resolve();
                    },
                    content: content,
                    showSessionEndedMessage: true,
                });
            });
            setCredentialPromise(isMediaSession, credentialPromise);
        }
        credentialPromise.then(() => {
            if (targets.has(target) && targetData.status === Status.LOADING) {
                targetData.xhr = imageLoader(target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onNetworkError, onUnrecoverableError);
            }
        });
    } else {
        targetData.xhr = imageLoader(target, targetData.src, targetData.alt, false, onImageDraw, targetData.onDataLoad, onNetworkError, onUnrecoverableError);
    }
}

export function unobserveAll() {
    observer.disconnect();
    targets.clear();
    mediaSessionCredentialPromise = null;
    newsSessionCredentialPromise = null;
}