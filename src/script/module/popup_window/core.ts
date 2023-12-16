import { addClass, appendChild, createDivElement, getBody, removeClass, replaceChildren, w } from '../dom';
import { addTimeout } from '../timer';
import '../../../css/popup_window.scss';

export type PopupWindow = {
    show: (...contents: Node[]) => void;
    hide: () => void;
};

let instance: Promise<PopupWindow> | null = null;

export function initializePopupWindow() {
    if (instance !== null) {
        return instance;
    }

    const container = createDivElement();
    container.id = 'pop-up-window';
    const popupWindow = createDivElement();
    const popupWindowcontent = createDivElement();
    appendChild(container, popupWindow);
    appendChild(popupWindow, popupWindowcontent);

    let currentTimeout: NodeJS.Timeout | null = null;

    const newInstance = new Promise<PopupWindow>((resolve) => {
        w.requestAnimationFrame(() => {
            if (newInstance !== instance) {
                return;
            }
            addClass(container, 'invisible');
            addClass(container, 'transparent');
            appendChild(getBody(), container);
            w.requestAnimationFrame(() => {
                if (newInstance !== instance) {
                    return;
                }
                resolve({
                    show: (...contents: Node[]) => {
                        if (instance !== newInstance) {
                            return;
                        }
                        currentTimeout = null;
                        replaceChildren(popupWindowcontent, ...contents);
                        removeClass(container, 'invisible');
                        removeClass(container, 'transparent');
                    },
                    hide: () => {
                        if (instance !== newInstance) {
                            return;
                        }
                        addClass(container, 'transparent');
                        const timeout = addTimeout(() => {
                            if (instance === newInstance && currentTimeout === timeout) {
                                addClass(container, 'invisible');
                                replaceChildren(popupWindowcontent);
                            }
                        }, 300);
                        currentTimeout = timeout;
                    }
                });
            });
        });
    });
    instance = newInstance;

    return instance;
}

export function destroy() {
    instance = null;
}