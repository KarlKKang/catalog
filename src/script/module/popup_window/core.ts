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
import { requestAnimationFrame } from '../animation_frame/request';

let popupWindow: [HTMLDivElement, HTMLDivElement] | null = null;
let wid: any;
let windowBusy = false;
const waitingQueue: (() => void)[] = [];
let currentCleanupCallback: (() => void) | null = null;

export { styles };

export function initializePopupWindow(contents: Node[], cleanupCallback: () => void, onDOMLoaded?: () => void) {
    addOffloadCallback(offloadPopupWindow);

    cleanupAll();
    currentCleanupCallback = cleanupCallback;

    const currentWid = {};
    wid = currentWid;
    windowBusy = true;

    const showContents = (container: HTMLDivElement, contentContainer: HTMLDivElement) => {
        requestAnimationFrame(() => {
            if (currentWid !== wid) {
                return;
            }
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
        requestAnimationFrame(() => {
            if (currentWid !== wid) {
                return;
            }
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
        windowBusy = false;

        const hideWid = {}; // Set a new ID to prevent the window from being shown by `requestAnimationFrame` in the event queue.
        wid = hideWid;
        setOpacity(container, 0);
        addTimeout(() => {
            if (hideWid !== wid) {
                return;
            }
            setVisibility(container, false);
            replaceChildren(contentContainer);
        }, 300);
    };
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
    if (!windowBusy) {
        callback();
        return;
    }
    addOffloadCallback(clearWaitingQueue);
    waitingQueue.push(callback);
}

function offloadPopupWindow() {
    cleanupAll();
    wid = {};
    popupWindow = null;
    windowBusy = false;
}

function clearWaitingQueue() {
    waitingQueue.length = 0;
}
