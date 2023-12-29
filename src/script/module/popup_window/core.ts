import { addClass, appendChild, createDivElement, getBody, removeClass, replaceChildren, w } from '../dom';
import { addTimeout } from '../timer';
import '../../../css/popup_window.scss';

let popupWindow: [HTMLDivElement, HTMLDivElement] | null = null;
let wid: any;

export function initializePopupWindow(...contents: Node[]) {
    const currentWid = {};
    wid = currentWid;

    const showContents = (container: HTMLDivElement, contentContainer: HTMLDivElement) => {
        w.requestAnimationFrame(() => {
            if (currentWid !== wid) {
                return;
            }
            replaceChildren(contentContainer, ...contents);
            removeClass(container, 'invisible');
            removeClass(container, 'transparent');
        });
    };

    let container: HTMLDivElement;
    let contentContainer: HTMLDivElement;
    if (popupWindow === null) {
        container = createDivElement();
        container.id = 'pop-up-window';
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
            appendChild(getBody(), container);
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

export function destroy() {
    wid = {};
    popupWindow = null;
}