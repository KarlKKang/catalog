import { addClass, appendChild, body, createDivElement, removeClass, replaceChildren, w } from '../dom';
import { addTimeout } from '../timer';
import * as styles from '../../../css/popup_window.module.scss';

let popupWindow: [HTMLDivElement, HTMLDivElement] | null = null;
let wid: any;
let windowOpen = false;
const waitingQueue: (() => void)[] = [];

export { styles };

export function initializePopupWindow(contents: Node[], onDOMLoaded?: () => void) {
    const currentWid = {};
    wid = currentWid;
    windowOpen = true;

    const showContents = (container: HTMLDivElement, contentContainer: HTMLDivElement) => {
        w.requestAnimationFrame(() => {
            if (currentWid !== wid) {
                return;
            }
            replaceChildren(contentContainer, ...contents);
            removeClass(container, 'invisible');
            removeClass(container, 'transparent');
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
        w.requestAnimationFrame(() => {
            if (currentWid !== wid) {
                return;
            }
            addClass(container, 'invisible');
            addClass(container, 'transparent');
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

        let waitingQueueCallback = waitingQueue.shift();
        while (waitingQueueCallback !== undefined) {
            waitingQueueCallback();
            if (currentWid !== wid) {
                return; // The window has been reopened.
            }
            waitingQueueCallback = waitingQueue.shift();
        }
        windowOpen = false;

        const hideWid = {}; // Set a new ID to prevent the window from being shown by `requestAnimationFrame` in the event queue.
        wid = hideWid;
        addClass(container, 'transparent');
        addTimeout(() => {
            if (hideWid !== wid) {
                return;
            }
            addClass(container, 'invisible');
            replaceChildren(contentContainer);
        }, 300);
    };
}

export function onPopupWindowClosed(callback: () => void) {
    if (!windowOpen) {
        callback();
        return;
    }
    waitingQueue.push(callback);
}

export function destroy() {
    wid = {};
    popupWindow = null;
    windowOpen = false;
    waitingQueue.length = 0;
}