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
import { RedirectFunc } from '../type/RedirectFunc';
import { moduleImportError } from '../message/template/param';

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
    redirect: RedirectFunc; // This redirect function must be provided by each target.
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

const imageLoaderImportPromise = import(
    /* webpackExports: ["default"] */
    '../image_loader'
);

export default function (
    target: Element,
    src: string,
    alt: string,
    redirect: RedirectFunc,
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
        redirect: redirect,
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
                addTimeout(async () => {
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
                                targetData.xhr = sendServerRequest(targetData.redirect, uri, {
                                    callback: async function (response: string) {
                                        if (response !== 'APPROVED') {
                                            showMessage(targetData.redirect, invalidResponse());
                                            return;
                                        }
                                        addTimeout(() => {
                                            setCredentialPromise(isMediaSession, null);
                                        }, 15 * 1000);
                                        resolve();
                                        targetData.xhr = await loadImage(targetData.redirect, target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onError);
                                    },
                                    content: content,
                                    showSessionEndedMessage: true,
                                });
                            }));
                        } else {
                            credentialPromise.then(async () => {
                                targetData.xhr = await loadImage(targetData.redirect, target, targetData.src, targetData.alt, true, onImageDraw, targetData.onDataLoad, onError);
                            });
                        }
                    } else {
                        targetData.xhr = await loadImage(targetData.redirect, target, targetData.src, targetData.alt, false, onImageDraw, targetData.onDataLoad, onError);
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

async function loadImage(redirect: RedirectFunc, container: Element, src: string, alt: string, withCredentials: boolean, onImageDraw?: (() => void) | undefined, onDataLoad?: ((data: Blob) => void) | undefined, onError?: (() => void) | undefined): Promise<XMLHttpRequest | null> {
    let imageLoader: Awaited<typeof imageLoaderImportPromise>;
    try {
        imageLoader = await imageLoaderImportPromise;
    } catch (e) {
        showMessage(redirect, moduleImportError(e));
        throw e;
    }

    if (targets.get(container) === undefined) {
        return null;
    }
    return imageLoader.default(redirect, container, src, alt, withCredentials, onImageDraw, onDataLoad, onError);
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