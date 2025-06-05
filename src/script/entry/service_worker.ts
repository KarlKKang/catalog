import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { getHostname } from '../module/dom/location/get/hostname';
import { windowLocation } from '../module/dom/location';
import { addEventListener } from '../module/event_listener/add';
import { Workbox } from 'workbox-window';
import { initializePopupWindow, onPopupWindowAvailable, styles } from '../module/popup_window/core';
import { disableButton } from '../module/dom/element/button/disable';
import { addOffloadCallback } from '../module/global/offload';
import { getEpochMs } from '../module/time/epoch_ms';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';
import { min } from '../module/math';
import { addTimeoutNative } from '../module/timer/add/native/timeout';
import { getSearchParam } from '../module/dom/location/get/search_param';

let swUpdateLastPromptTime = 0;
let serviceWorker: Workbox | null = null;
let serviceWorkerUpToDate = true;
let registering = false;
let promptAllowed = false;

export default function () {
    if (ENABLE_DEBUG && getSearchParam('pwa') === '1') {
        register();
    } else {
        unregister();
    }
}

async function unregister() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
        if (ENABLE_DEBUG) {
            console.log('Unregistering service worker:', registration);
        }
        await registration.unregister();
    }
    if (registrations.length > 0) {
        await unregisterCleanup();
        windowLocation.reload();
    }
}

async function unregisterCleanup() {
    indexedDB.deleteDatabase('workbox-expiration');
    const cacheKeys = await caches.keys();
    for (const cacheKey of cacheKeys) {
        if (ENABLE_DEBUG) {
            console.log('Deleting cache:', cacheKey);
        }
        await caches.delete(cacheKey);
    }
}

async function register() { // This function should be called after setting the `pgid`.
    addOffloadCallback(offload);
    promptAllowed = true;

    if (serviceWorker === null) {
        const wb = new Workbox('/sw.js');
        serviceWorker = wb;

        // These two event should never be removed.
        const wbAddEventListener = wb.addEventListener.bind(wb);
        wbAddEventListener('waiting', () => {
            if (ENABLE_DEBUG) {
                console.log('Service worker waiting.');
            }
            serviceWorkerUpToDate = false;
            if (promptAllowed) {
                showSkipWaitingPrompt(wb);
            }
        });
        wbAddEventListener('controlling', () => {
            if (!serviceWorkerUpToDate) {
                if (ENABLE_DEBUG) {
                    console.log('Service worker updated.');
                }
                windowLocation.reload();
            }
        });
        wbAddEventListener('redundant', () => {
            if (serviceWorkerUpToDate) {
                if (ENABLE_DEBUG) {
                    console.log('New service worker failed to install, retrying.');
                }
                registerOrUpdate(wb);
            }
        });

        registerOrUpdate(serviceWorker);
    } else {
        if (swUpdateLastPromptTime < getEpochMs() - 24 * 60 * 60 * 1000) {
            if (serviceWorkerUpToDate) {
                registerOrUpdate(serviceWorker);
            } else {
                showSkipWaitingPrompt(serviceWorker);
            }
        }
    }
}

async function registerOrUpdate(wb: Workbox, retryTimeout = 500) {
    if (registering) {
        return;
    }
    registering = true;
    try {
        await wb.register();
        if (ENABLE_DEBUG) {
            console.log('Service worker registered, triggering update.');
        }
        await wb.update();
        if (ENABLE_DEBUG) {
            console.log('Service worker update triggered.');
        }
    } catch (e) {
        if (ENABLE_DEBUG) {
            console.log('Service worker register or update failed, retrying in ' + retryTimeout + 'ms.');
        }
        addTimeoutNative(() => {
            registering = false;
            registerOrUpdate(wb, min(retryTimeout * 2, 5000));
        }, retryTimeout);
        throw e;
    }
    registering = false;
}

function showSkipWaitingPrompt(wb: Workbox) {
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

    onPopupWindowAvailable(() => {
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

function offload() {
    promptAllowed = false;
}
