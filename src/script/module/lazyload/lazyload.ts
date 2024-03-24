import {
    SessionTypes,
} from '../common';
import { ServerRequestOptionProp, sendServerRequest } from '../server';
import {
    addClass, appendChild, createDivElement,
} from '../dom';
import { showMessage } from '../message';
import { invalidResponse } from '../server/message';
import { addTimeout } from '../timer';
import type { default as ImageLoader } from '../image_loader';
import * as styles from '../../../css/lazyload.module.scss';

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

const enum TargetDataIdx {
    SRC,
    ALT,
    DELAY,
    ON_DATA_LOAD,
    ON_IMAGE_DRAW,
    STATUS,
    XHR,
}

type TargetData = [
    string, // src
    string, // alt
    number, // delay
    ((data: Blob) => void) | undefined, // onDataLoad
    ((canvas: HTMLCanvasElement) => void) | undefined, // onImageDraw
    Status, // status
    XMLHttpRequest | null, // xhr
];

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
        onImageDraw?: (canvas: HTMLCanvasElement) => void;
    }
) {
    if (options === undefined) {
        options = {};
    }

    addClass(target, styles.lazyload);
    const overlay = createDivElement();
    addClass(overlay, styles.overlay);
    appendChild(target, overlay);

    observer.observe(target);
    targets.set(target, [
        src,
        alt,
        options.delay || 0,
        options.onDataLoad,
        options.onImageDraw,
        Status.LISTENING,
        null
    ]);
}

function observerCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
        const target = entry.target;
        const targetData = targets.get(target);
        if (targetData === undefined) {
            throw new Error('Cannot find lazyload target data.');
        }

        if (entry['isIntersecting']) {
            if (targetData[TargetDataIdx.STATUS] === Status.LISTENING) {
                targetData[TargetDataIdx.STATUS] = Status.WAITING;
                addTimeout(() => {
                    if (!targets.has(target) || targetData[TargetDataIdx.STATUS] !== Status.WAITING) {
                        return;
                    }
                    targetData[TargetDataIdx.STATUS] = Status.LOADING;
                    loadImage(target, targetData);
                }, targetData[TargetDataIdx.DELAY]);
            }
        } else {
            if (targetData[TargetDataIdx.STATUS] === Status.WAITING) {
                targetData[TargetDataIdx.STATUS] = Status.LISTENING;
            } else if (targetData[TargetDataIdx.STATUS] === Status.LOADING) {
                if (targetData[TargetDataIdx.XHR] !== null) {
                    if (targetData[TargetDataIdx.XHR].readyState === XMLHttpRequest.DONE) { // onImageDraw for the imageLoader may be called after decoding webp.
                        continue;
                    } else {
                        targetData[TargetDataIdx.XHR].abort();
                        targetData[TargetDataIdx.XHR] = null;
                    }
                }
                targetData[TargetDataIdx.STATUS] = Status.LISTENING;
            }
        }
    }
}

function loadImage(target: Element, targetData: TargetData) {
    const onImageDraw = (canvas: HTMLCanvasElement) => {
        observer.unobserve(target);
        targets.delete(target);
        addClass(target, styles.complete);
        targetData[TargetDataIdx.ON_IMAGE_DRAW] && targetData[TargetDataIdx.ON_IMAGE_DRAW](canvas);
    };
    const onUnrecoverableError = () => {
        observer.unobserve(target);
        targets.delete(target);
    };
    const onNetworkError = () => {
        addTimeout(() => {
            if (targets.has(target) && targetData[TargetDataIdx.STATUS] === Status.LOADING) {
                loadImage(target, targetData);
            }
        }, 5000);
    };

    if (credential !== null) {
        const sessionCredential = credential[0];
        const uri = credential[1] === SessionTypes.MEDIA ? 'get_image' : 'get_news_image';

        if (sessionCredentialPromise === null) {
            sessionCredentialPromise = new Promise((resolve) => {
                sendServerRequest(uri, {
                    [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                        if (response !== 'APPROVED') {
                            showMessage(invalidResponse());
                            return;
                        }
                        addTimeout(() => {
                            sessionCredentialPromise = null;
                        }, 15 * 1000);
                        resolve();
                    },
                    [ServerRequestOptionProp.CONTENT]: sessionCredential,
                    [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
                });
            });
        }
        sessionCredentialPromise.then(() => {
            if (targets.has(target) && targetData[TargetDataIdx.STATUS] === Status.LOADING) {
                targetData[TargetDataIdx.XHR] = imageLoader(target, targetData[TargetDataIdx.SRC], targetData[TargetDataIdx.ALT], true, onImageDraw, targetData[TargetDataIdx.ON_DATA_LOAD], onNetworkError, onUnrecoverableError);
            }
        });
    } else {
        targetData[TargetDataIdx.XHR] = imageLoader(target, targetData[TargetDataIdx.SRC], targetData[TargetDataIdx.ALT], false, onImageDraw, targetData[TargetDataIdx.ON_DATA_LOAD], onNetworkError, onUnrecoverableError);
    }
}

export function unobserveAll() {
    observer.disconnect();
    targets.clear();
    sessionCredentialPromise = null;
    credential = null;
}