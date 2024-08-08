import {
    ImageSessionTypes,
} from './media_helper';
import { ServerRequestOptionProp, sendServerRequest } from './server';
import { appendChild } from './dom/change_node';
import { addClass } from './dom/class';
import { createDivElement } from './dom/create_element';
import { showMessage } from './message';
import { invalidResponse } from './server/message';
import { addTimeout, removeTimeout, type Timeout } from './timer';
import * as styles from '../../css/lazyload.module.scss';
import { imageLoader, offload as offloadImageLoader } from './image_loader';
import { getHighResTimestamp } from './hi_res_timestamp';
import { max } from './math';
import { abortXhr } from './xhr';

const observer = new IntersectionObserver(observerCallback, {
    root: null,
    rootMargin: '50% 0px 50% 0px',
    threshold: [0],
});

const enum TargetDataKey {
    SRC,
    ALT,
    DELAY,
    ON_DATA_LOAD,
    ON_IMAGE_DRAW,
    JOB_ID,
    XHR,
    WAIT_TIMEOUT,
}
interface TargetData {
    [TargetDataKey.SRC]: string;
    [TargetDataKey.ALT]: string;
    [TargetDataKey.DELAY]: number;
    [TargetDataKey.ON_DATA_LOAD]: ((data: Blob) => void) | undefined;
    [TargetDataKey.ON_IMAGE_DRAW]: ((canvas: HTMLCanvasElement) => void) | undefined;
    [TargetDataKey.JOB_ID]: any;
    [TargetDataKey.XHR]: XMLHttpRequest | null;
    [TargetDataKey.WAIT_TIMEOUT]: Timeout | null;
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
        [TargetDataKey.JOB_ID]: null,
        [TargetDataKey.XHR]: null,
        [TargetDataKey.WAIT_TIMEOUT]: null,
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
            if (targetData[TargetDataKey.JOB_ID] === null) {
                targetData[TargetDataKey.JOB_ID] = {};
                targetData[TargetDataKey.WAIT_TIMEOUT] = addTimeout(() => {
                    targetData[TargetDataKey.WAIT_TIMEOUT] = null;
                    loadImage(target, targetData);
                }, targetData[TargetDataKey.DELAY]);
            }
        } else {
            if (targetData[TargetDataKey.JOB_ID] !== null) {
                const waitTimeout = targetData[TargetDataKey.WAIT_TIMEOUT];
                const xhr = targetData[TargetDataKey.XHR];
                if (waitTimeout !== null) {
                    removeTimeout(waitTimeout);
                    targetData[TargetDataKey.WAIT_TIMEOUT] = null;
                }
                if (xhr !== null) {
                    abortXhr(xhr);
                    targetData[TargetDataKey.XHR] = null;
                }
                targetData[TargetDataKey.JOB_ID] = null;
            }
        }
    }
}

function loadImage(target: Element, targetData: TargetData) {
    const jobId = targetData[TargetDataKey.JOB_ID];
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
        targetData[TargetDataKey.XHR] = null;
        targetData[TargetDataKey.WAIT_TIMEOUT] = addTimeout(() => {
            targetData[TargetDataKey.WAIT_TIMEOUT] = null;
            loadImage(target, targetData);
        }, 5000);
    };
    const onDataLoad = (data: Blob) => {
        targetData[TargetDataKey.XHR] = null;
        targetData[TargetDataKey.ON_DATA_LOAD] && targetData[TargetDataKey.ON_DATA_LOAD](data);
    };

    if (credential !== null) {
        const sessionCredential = credential[0];
        const uri = credential[1] === ImageSessionTypes.MEDIA ? 'get_image' : 'get_news_image';

        if (sessionCredentialPromise === null) {
            const currentSessionCredentialPromise = new Promise<void>((resolve) => {
                let startTime = getHighResTimestamp();
                sendServerRequest(uri, {
                    [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                        if (response !== 'APPROVED') {
                            showMessage(invalidResponse());
                            return;
                        }
                        addTimeout(() => {
                            if (sessionCredentialPromise === currentSessionCredentialPromise) {
                                sessionCredentialPromise = null;
                            }
                        }, max(30000 - (getHighResTimestamp() - startTime), 0));
                        resolve();
                    },
                    [ServerRequestOptionProp.CONTENT]: sessionCredential,
                    [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
                    [ServerRequestOptionProp.ON_RETRY]: () => {
                        startTime = getHighResTimestamp();
                    },
                    [ServerRequestOptionProp.TIMEOUT]: 30000,
                });
            });
            sessionCredentialPromise = currentSessionCredentialPromise;
        }
        sessionCredentialPromise.then(() => {
            if (targetData[TargetDataKey.JOB_ID] === jobId) {
                targetData[TargetDataKey.XHR] = imageLoader(target, targetData[TargetDataKey.SRC], targetData[TargetDataKey.ALT], true, onImageDraw, onDataLoad, onNetworkError, onUnrecoverableError);
            }
        });
    } else {
        targetData[TargetDataKey.XHR] = imageLoader(target, targetData[TargetDataKey.SRC], targetData[TargetDataKey.ALT], false, onImageDraw, onDataLoad, onNetworkError, onUnrecoverableError);
    }
}

export function offload() {
    observer.disconnect();
    for (const targetData of targets.values()) {
        targetData[TargetDataKey.JOB_ID] = null;
        targetData[TargetDataKey.WAIT_TIMEOUT] && removeTimeout(targetData[TargetDataKey.WAIT_TIMEOUT]);
        targetData[TargetDataKey.XHR] && abortXhr(targetData[TargetDataKey.XHR]);
    }
    targets.clear();
    sessionCredentialPromise = null;
    credential = null;
    offloadImageLoader();
}
