import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { getHostname } from '../module/dom/location/get/hostname';
import { windowLocation } from '../module/dom/location';
import { addEventListener } from '../module/event_listener/add';
import { Workbox } from 'workbox-window';
import { initializePopupWindow, onPopupWindowClosed, styles } from '../module/popup_window/core';
import { disableButton } from '../module/dom/element/button/disable';
import { min } from '../module/math/min';
import { addOffloadCallback } from '../module/global/offload';
import { pgid } from '../module/global/pgid';
import { addTimeout } from '../module/timer/add/timeout';
import { getEpochMs } from '../module/time/epoch_ms';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';

let swUpdateLastPromptTime = 0;
let serviceWorker: Workbox | null = null;
let serviceWorkerUpToDate = true;
let registering = false;

export default async function () { // This function should be called after setting the `pgid`.
    addOffloadCallback(offload);

    const showSkipWaitingPrompt = (wb: Workbox) => {
        const titleText = createParagraphElement('アップデートが利用可能です');
        addClass(titleText, styles.title);

        const domain = getHostname();
        const promptText = createParagraphElement('今すぐインストールすると、ページが再読み込みされます。' + domain + 'の複数のタブを開いている場合、他のタブで問題が発生する可能性があります。後で手動でインストールすることもできます。その場合は、' + domain + 'のすべてのタブを閉じてから再読み込みしてください。');

        const updateButton = createStyledButtonElement('インストール');
        const cancelButton = createStyledButtonElement('後で');
        const buttonFlexbox = createDivElement();
        addClass(buttonFlexbox, styles.inputFlexbox);
        appendChild(buttonFlexbox, updateButton);
        appendChild(buttonFlexbox, cancelButton);

        onPopupWindowClosed(() => {
            const disableAllInputs = (disabled: boolean) => {
                disableButton(updateButton, disabled);
                disableButton(cancelButton, disabled);
            };
            addEventListener(updateButton, 'click', () => {
                disableAllInputs(true);
                wb.messageSkipWaiting();
            });
            addEventListener(cancelButton, 'click', () => {
                swUpdateLastPromptTime = getEpochMs();
                hidePopupWindow();
            });
            const hidePopupWindow = initializePopupWindow(
                [titleText, promptText, buttonFlexbox],
                () => {
                    removeAllEventListeners(updateButton);
                    removeAllEventListeners(cancelButton);
                },
            );
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

function offload() {
    registering = false;
}
