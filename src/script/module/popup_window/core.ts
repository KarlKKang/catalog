import { addClass, appendChild, body, createDivElement, replaceChildren, w } from '../dom';
import { addTimeout } from '../timer';
import * as styles from '../../../css/popup_window.module.scss';
import { setOpacity, setVisibility } from '../style';

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
        w.requestAnimationFrame(() => {
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