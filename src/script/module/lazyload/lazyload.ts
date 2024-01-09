import 'intersection-observer';
import {
    type SessionTypes,
    sendServerRequest,
    SESSION_TYPE_MEDIA,
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
    delay: number;
    onDataLoad: ((data: Blob) => void) | undefined;
    onImageDraw: (() => void) | undefined;
    status: Status;
    xhr: XMLHttpRequest | null;
};

const targets: Map<Element, TargetData> = new Map();
let sessionCredentialPromise: Promise<void> | null = null;
let credential: [
    string, // sessionCredential
    SessionTypes // sessionType
] | null = null;

let imageLoader: typeof ImageLoader;

export function attachImageLoader(loader: typeof ImageLoader) {
    imageLoader = loader;
}

export function setCredential(sessionCredential: string, sessionType: SessionTypes) {
    credential = [sessionCredential, sessionType];
}

export default function (
    target: Element,
    src: string,
    alt: string,
    options?: {
        delay?: number;
        onDataLoad?: (data: Blob) => void;
        onImageDraw?: () => void;
    }
) {
    if (options === undefined) {
        options = {};
    }

    observer.observe(target);
    targets.set(target, {
        src: src,
        alt: alt,
        delay: options.delay || 0,
        onDataLoad: options.onDataLoad,
        onImageDraw: options.onImageDraw,
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
                    if (targetData.xhr.readyState === XMLHttpRequest.DONE) { // onImageDraw for the imageLoader may be called after decoding webp.
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

function loadImage(target: Element, targetData: TargetData) {
    const onImageDraw = () => {
        observer.unobserve(target);
        targets.delete(target);
        addClass(target, 'complete');
        targetData.onImageDraw && targetData.onImageDraw();
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

    if (credential !== null) {
        const sessionCredential = credential[0];
        const uri = credential[1] === SESSION_TYPE_MEDIA ? 'get_image' : 'get_news_image';

        if (sessionCredentialPromise === null) {
            sessionCredentialPromise = new Promise((resolve) => {
                sendServerRequest(uri, {
                    callback: function (response: string) {
                        if (response !== 'APPROVED') {
                            showMessage(invalidResponse());
                            return;
                        }
                        addTimeout(() => {
                            sessionCredentialPromise = null;
                        }, 15 * 1000);
                        resolve();
                    },
                    content: sessionCredential,
                    showSessionEndedMessage: true,
                });
            });
        }
        sessionCredentialPromise.then(() => {
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
    sessionCredentialPromise = null;
    credential = null;
}