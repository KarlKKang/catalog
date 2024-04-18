import { createButtonElement, createDivElement, createParagraphElement } from '../module/dom/create_element';
import { addClass, appendChild } from '../module/dom/element';
import { windowLocation } from '../module/dom/document';
import { addEventListener } from '../module/dom/event_listener';
import { DOMAIN } from '../module/env/constant';
import { Workbox } from 'workbox-window';
import { initializePopupWindow, offloadPopupWindow, onPopupWindowClosed, styles } from '../module/popup_window/core';

let swUpdateLastPromptTime: number = 0;
let serviceWorker: Workbox | null = null;
let serviceWorkerUpToDate: boolean = true;

export default async function () { // This function should be called after setting the `pgid`.
    const showSkipWaitingPrompt = (wb: Workbox) => {
        const titleText = createParagraphElement('アップデートが利用可能です');
        addClass(titleText, styles.title);

        const promptText = createParagraphElement('今すぐインストールすると、ページが再読み込みされます。' + DOMAIN + 'の複数のタブを開いている場合、他のタブで問題が発生する可能性があります。後で手動でインストールすることもできます。その場合は、' + DOMAIN + 'のすべてのタブを閉じてから再読み込みしてください。');

        const updateButton = createButtonElement('インストール');
        const cancelButton = createButtonElement('後で');
        const buttonFlexbox = createDivElement();
        addClass(buttonFlexbox, styles.inputFlexbox);
        appendChild(buttonFlexbox, updateButton);
        appendChild(buttonFlexbox, cancelButton);

        onPopupWindowClosed(() => {
            const hidePopupWindow = initializePopupWindow([titleText, promptText, buttonFlexbox]);
            const disableAllInputs = (disabled: boolean) => {
                updateButton.disabled = disabled;
                cancelButton.disabled = disabled;
            };
            addEventListener(updateButton, 'click', () => {
                disableAllInputs(true);
                if (serviceWorkerUpToDate) {
                    if (DEVELOPMENT) {
                        console.log('Service worker already up to date.');
                    }
                    windowLocation.reload();
                    return;
                }
                addEventListener(wb as unknown as EventTarget, 'controlling', () => {
                    windowLocation.reload();
                });
                wb.messageSkipWaiting();
            });
            addEventListener(cancelButton, 'click', () => {
                swUpdateLastPromptTime = new Date().getTime();
                hidePopupWindow();
            });
        });
    };

    const addWaitingListener = (wb: Workbox) => {
        addEventListener(serviceWorker as unknown as EventTarget, 'waiting', () => {
            showSkipWaitingPrompt(wb);
        });
    };

    if (serviceWorker === null) {
        serviceWorker = new Workbox('/sw.js');

        // These two event should never be removed.
        serviceWorker.addEventListener('waiting', () => {
            if (DEVELOPMENT) {
                console.log('Service worker waiting.');
            }
            serviceWorkerUpToDate = false;
        });
        serviceWorker.addEventListener('controlling', () => {
            if (DEVELOPMENT) {
                console.log('Service worker controlling.');
            }
            serviceWorkerUpToDate = true;
        });

        addWaitingListener(serviceWorker);
        serviceWorker.register();
    } else {
        if (swUpdateLastPromptTime < Date.now() - 24 * 60 * 60 * 1000) {
            if (serviceWorkerUpToDate) {
                addWaitingListener(serviceWorker);
                serviceWorker.update();
            } else {
                showSkipWaitingPrompt(serviceWorker);
            }
        }
    }
}

export function offload() {
    offloadPopupWindow();
}