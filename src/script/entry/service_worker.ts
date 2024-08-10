import { createButtonElement, createDivElement, createParagraphElement } from '../module/dom/create_element';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { getHostname, windowLocation } from '../module/dom/document';
import { addEventListener } from '../module/event_listener';
import { Workbox } from 'workbox-window';
import { initializePopupWindow, offloadPopupWindow, onPopupWindowClosed, styles } from '../module/popup_window/core';
import { disableButton } from '../module/dom/change_input';
import { min } from '../module/math';
import { pgid } from '../module/global';
import { addTimeout } from '../module/timer';

let swUpdateLastPromptTime = 0;
let serviceWorker: Workbox | null = null;
let serviceWorkerUpToDate = true;
let registering = false;

export default async function () { // This function should be called after setting the `pgid`.
    const showSkipWaitingPrompt = (wb: Workbox) => {
        const titleText = createParagraphElement('アップデートが利用可能です');
        addClass(titleText, styles.title);

        const domain = getHostname();
        const promptText = createParagraphElement('今すぐインストールすると、ページが再読み込みされます。' + domain + 'の複数のタブを開いている場合、他のタブで問題が発生する可能性があります。後で手動でインストールすることもできます。その場合は、' + domain + 'のすべてのタブを閉じてから再読み込みしてください。');

        const updateButton = createButtonElement('インストール');
        const cancelButton = createButtonElement('後で');
        const buttonFlexbox = createDivElement();
        addClass(buttonFlexbox, styles.inputFlexbox);
        appendChild(buttonFlexbox, updateButton);
        appendChild(buttonFlexbox, cancelButton);

        onPopupWindowClosed(() => {
            const hidePopupWindow = initializePopupWindow([titleText, promptText, buttonFlexbox]);
            const disableAllInputs = (disabled: boolean) => {
                disableButton(updateButton, disabled);
                disableButton(cancelButton, disabled);
            };
            addEventListener(updateButton, 'click', () => {
                disableAllInputs(true);
                wb.messageSkipWaiting();
            });
            addEventListener(cancelButton, 'click', () => {
                swUpdateLastPromptTime = new Date().getTime();
                hidePopupWindow();
            });
        });
    };

    const attachEvents = (wb: Workbox) => {
        addEventListener(wb as unknown as EventTarget, 'waiting', () => {
            showSkipWaitingPrompt(wb);
        });
        addEventListener(wb as unknown as EventTarget, 'redundant', () => {
            if (serviceWorkerUpToDate && !registering) { // Checking for `registering` is necessary to prevent double retry when there's no service worker installed.
                if (DEVELOPMENT) {
                    console.log('New service worker failed to install, retrying.');
                }
                registerOrUpdate(wb);
            }
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
            if (!serviceWorkerUpToDate) {
                if (DEVELOPMENT) {
                    console.log('Service worker updated.');
                }
                windowLocation.reload();
            }
        });

        attachEvents(serviceWorker);
        registerOrUpdate(serviceWorker);
    } else {
        if (swUpdateLastPromptTime < Date.now() - 24 * 60 * 60 * 1000) {
            if (serviceWorkerUpToDate) {
                attachEvents(serviceWorker);
                registerOrUpdate(serviceWorker);
            } else {
                showSkipWaitingPrompt(serviceWorker);
            }
        }
    }
}

async function registerOrUpdate(wb: Workbox, retryTimeout = 500) {
    registering = true;
    const currentPgid = pgid;
    try {
        await wb.register();
        if (currentPgid !== pgid) {
            return;
        }
        if (DEVELOPMENT) {
            console.log('Service worker registered, triggering update.');
        }
        await wb.update();
        if (DEVELOPMENT) {
            console.log('Service worker update triggered.');
        }
    } catch (e) {
        if (currentPgid !== pgid) {
            return;
        }
        if (DEVELOPMENT) {
            console.log('Service worker register or update failed, retrying in ' + retryTimeout + 'ms.');
        }
        addTimeout(() => {
            registerOrUpdate(wb, min(retryTimeout * 2, 5000));
        }, retryTimeout);
        throw e;
    }
    registering = false;
}

export function offload() {
    registering = false;
    offloadPopupWindow();
}
