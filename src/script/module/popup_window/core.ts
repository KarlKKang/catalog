import { replaceChildren } from '../dom/node/replace_children';
import { appendChild } from '../dom/node/append_child';
import { addClass } from '../dom/class/add';
import { createDivElement } from '../dom/element/div/create';
import { body } from '../dom/body';
import { addTimeout } from '../timer/add/timeout';
import * as styles from '../../../css/popup_window.module.scss';
import { setVisibility } from '../style/visibility';
import { setOpacity } from '../style/opacity';
import { addOffloadCallback } from '../global/offload';
import { addAnimationFrame } from '../animation_frame/add';
import type { AnimationFrame } from '../animation_frame/type';
import type { Timeout } from '../timer/type';
import { removeAnimationFrame } from '../animation_frame/remove';
import { removeTimeout } from '../timer/remove/timeout';

let popupWindow: [HTMLDivElement, HTMLDivElement] | null = null;
let wid: object | null = null;
const waitingQueue: (() => void)[] = [];
let currentCleanupCallback: (() => void) | null = null;
let currentAnimationFrame: AnimationFrame | null = null;
let currentTimeout: Timeout | null = null;

export { styles };

export function initializePopupWindow(contents: Node[], cleanupCallback: () => void, onDOMLoaded?: () => void) {
    addOffloadCallback(offloadPopupWindow);

    cleanupAll();
    currentCleanupCallback = () => {
        cleanupAnimationFrame();
        if (currentTimeout !== null) {
            removeTimeout(currentTimeout);
            currentTimeout = null;
        }
        cleanupCallback();
    };

    const currentWid = {};
    wid = currentWid;

    const showContents = (container: HTMLDivElement, contentContainer: HTMLDivElement) => {
        currentAnimationFrame = addAnimationFrame(() => {
            currentAnimationFrame = null;
            replaceChildren(contentContainer, ...contents);
            setVisibility(container, true);
            setOpacity(container, 1);
            onDOMLoaded?.();
        });
    };

    let container: HTMLDivElement;
    let contentContainer: HTMLDivElement;
    if (popupWindow === null) {
        container = createDivElement();
        addClass(container, styles.container);
        const innerContainer = createDivElement();
        contentContainer = createDivElement();
        appendChild(container, innerContainer);
        appendChild(innerContainer, contentContainer);
        currentAnimationFrame = addAnimationFrame(() => {
            setVisibility(container, false);
            setOpacity(container, 0);
            appendChild(body, container);
            popupWindow = [container, contentContainer];
            showContents(container, contentContainer);
        });
    } else {
        [container, contentContainer] = popupWindow;
        showContents(container, contentContainer);
    }

    return () => {
        if (currentWid !== wid) {
            return;
        }

        cleanupAnimationFrame();
        currentCleanupCallback = null;
        cleanupCallback();
        if (currentWid !== wid) {
            return; // The window has been reopened in the cleanup callback.
        }

        let waitingQueueCallback = waitingQueue.shift();
        while (waitingQueueCallback !== undefined) {
            waitingQueueCallback();
            if (currentWid !== wid) {
                return; // The window has been reopened.
            }
            waitingQueueCallback = waitingQueue.shift();
        }
        wid = null;

        setOpacity(container, 0);
        currentTimeout = addTimeout(() => {
            currentTimeout = null;
            setVisibility(container, false);
            replaceChildren(contentContainer);
        }, 300);
    };
}

function cleanupAnimationFrame() {
    if (currentAnimationFrame !== null) {
        removeAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }
}

function cleanupAll() {
    // This is to ensure that if another popup window is initialized in the cleanup callback, it won't stuck in an infinite loop, and all cleanup callbacks are called.
    while (currentCleanupCallback !== null) {
        const previousCleanupCallback = currentCleanupCallback;
        currentCleanupCallback = null;
        previousCleanupCallback();
    }
}

export function onPopupWindowAvailable(callback: () => void) {
    if (wid === null) {
        callback();
        return;
    }
    addOffloadCallback(clearWaitingQueue);
    waitingQueue.push(callback);
}

function offloadPopupWindow() {
    cleanupAll();
    wid = null;
    popupWindow = null;
}

function clearWaitingQueue() {
    waitingQueue.length = 0;
}
