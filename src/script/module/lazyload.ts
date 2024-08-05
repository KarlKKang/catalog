import {
    ImageSessionTypes,
} from './media_helper';
import { ServerRequestOptionProp, sendServerRequest } from './server';
import { addClass, appendChild } from './dom/element';
import { createDivElement } from './dom/create_element';
import { showMessage } from './message';
import { invalidResponse } from './server/message';
import { addTimeout } from './timer';
import * as styles from '../../css/lazyload.module.scss';
import { imageLoader, offload as offloadImageLoader } from './image_loader';

const observer = new IntersectionObserver(observerCallback, {
    root: null,
    rootMargin: '50% 0px 50% 0px',
    threshold: [0],
});

const enum Status {
    LISTENING,
    WAITING,
    LOADING,
}

const enum TargetDataKey {
    SRC,
    ALT,
    DELAY,
    ON_DATA_LOAD,
    ON_IMAGE_DRAW,
    STATUS,
    XHR,
}
interface TargetData {
    [TargetDataKey.SRC]: string;
    [TargetDataKey.ALT]: string;
    [TargetDataKey.DELAY]: number;
    [TargetDataKey.ON_DATA_LOAD]: ((data: Blob) => void) | undefined;
    [TargetDataKey.ON_IMAGE_DRAW]: ((canvas: HTMLCanvasElement) => void) | undefined;
    [TargetDataKey.STATUS]: Status;
    [TargetDataKey.XHR]: XMLHttpRequest | null;
}

const targets = new Map<Element, TargetData>();
let sessionCredentialPromise: Promise<void> | null = null;
let credential: [
    string, // sessionCredential
    ImageSessionTypes, // sessionType
] | null = null;

export function setLazyloadCredential(sessionCredential: string, sessionType: ImageSessionTypes) {
    credential = [sessionCredential, sessionType];
}

export function attachLazyload(
    target: Element,
    src: string,
    alt: string,
    delay?: number,
    onDataLoad?: (data: Blob) => void,
    onImageDraw?: (canvas: HTMLCanvasElement) => void,
) {
    addClass(target, styles.lazyload);
    const overlay = createDivElement();
    addClass(overlay, styles.overlay);
    appendChild(target, overlay);

    observer.observe(target);
    targets.set(target, {
        [TargetDataKey.SRC]: src,
        [TargetDataKey.ALT]: alt,
        [TargetDataKey.DELAY]: delay || 0,
        [TargetDataKey.ON_DATA_LOAD]: onDataLoad,
        [TargetDataKey.ON_IMAGE_DRAW]: onImageDraw,
        [TargetDataKey.STATUS]: Status.LISTENING,
        [TargetDataKey.XHR]: null,
    });
}

function observerCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
        const target = entry.target;
        const targetData = targets.get(target);
        if (targetData === undefined) {
            continue;
        }

        if (entry['isIntersecting']) {
            if (targetData[TargetDataKey.STATUS] === Status.LISTENING) {
                targetData[TargetDataKey.STATUS] = Status.WAITING;
                addTimeout(() => {
                    if (!targets.has(target) || targetData[TargetDataKey.STATUS] !== Status.WAITING) {
                        return;
                    }
                    targetData[TargetDataKey.STATUS] = Status.LOADING;
                    loadImage(target, targetData);
                }, targetData[TargetDataKey.DELAY]);
            }
        } else {
            if (targetData[TargetDataKey.STATUS] === Status.WAITING) {
                targetData[TargetDataKey.STATUS] = Status.LISTENING;
            } else if (targetData[TargetDataKey.STATUS] === Status.LOADING) {
                if (targetData[TargetDataKey.XHR] !== null) {
                    if (targetData[TargetDataKey.XHR].readyState === XMLHttpRequest.DONE) { // onImageDraw for the imageLoader may be called after decoding webp.
                        continue;
                    } else {
                        targetData[TargetDataKey.XHR].abort();
                        targetData[TargetDataKey.XHR] = null;
                    }
                }
                targetData[TargetDataKey.STATUS] = Status.LISTENING;
            }
        }
    }
}

function loadImage(target: Element, targetData: TargetData) {
    const onImageDraw = (canvas: HTMLCanvasElement) => {
        observer.unobserve(target);
        targets.delete(target);
        addClass(target, styles.complete);
        targetData[TargetDataKey.ON_IMAGE_DRAW] && targetData[TargetDataKey.ON_IMAGE_DRAW](canvas);
    };
    const onUnrecoverableError = () => {
        observer.unobserve(target);
        targets.delete(target);
    };
    const onNetworkError = () => {
        addTimeout(() => {
            if (targets.has(target) && targetData[TargetDataKey.STATUS] === Status.LOADING) {
                loadImage(target, targetData);
            }
        }, 5000);
    };

    if (credential !== null) {
        const sessionCredential = credential[0];
        const uri = credential[1] === ImageSessionTypes.MEDIA ? 'get_image' : 'get_news_image';

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
            if (targets.has(target) && targetData[TargetDataKey.STATUS] === Status.LOADING) {
                targetData[TargetDataKey.XHR] = imageLoader(target, targetData[TargetDataKey.SRC], targetData[TargetDataKey.ALT], true, onImageDraw, targetData[TargetDataKey.ON_DATA_LOAD], onNetworkError, onUnrecoverableError);
            }
        });
    } else {
        targetData[TargetDataKey.XHR] = imageLoader(target, targetData[TargetDataKey.SRC], targetData[TargetDataKey.ALT], false, onImageDraw, targetData[TargetDataKey.ON_DATA_LOAD], onNetworkError, onUnrecoverableError);
    }
}

export function offload() {
    observer.disconnect();
    targets.clear();
    sessionCredentialPromise = null;
    credential = null;
    offloadImageLoader();
}
