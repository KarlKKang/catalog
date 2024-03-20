import {
    TOP_URL
} from '../env/constant';
import {
    w,
    getHash,
    getByIdNative,
    addEventListener,
    setSessionStorage,
    getTitle,
    openWindow,
    clearSessionStorage,
} from '../dom';

import { addTimeout } from '../timer';
import { pgid } from '../global';
import type { TotpPopupWindow } from '../popup_window/totp';
import type { popupWindowImport, promptForTotpImport } from '../popup_window';

export function getURLParam(name: string): string | null {
    const urlObj = new URL(w.location.href);
    return urlObj.searchParams.get(name);
}

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}

export function removeRightClick(elem: Element) {
    addEventListener(elem, 'contextmenu', (event) => event.preventDefault());
}

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getByIdNative(scrollID);
        if (elem !== null) {
            addTimeout(() => {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); //Give UI some time to load.
        }
    }
}

export async function handleFailedTotp(
    popupWindowImportPromise: ReturnType<typeof popupWindowImport>,
    promptForTotpImportPromise: ReturnType<typeof promptForTotpImport>,
    currentTotpPopupWindow: TotpPopupWindow | undefined,
    closeCallback: () => void,
    timeoutCallback: () => void,
    retryCallback: (totpPopupWindow: TotpPopupWindow) => void,
) {
    const currentPgid = pgid;
    const promptForTotp = await promptForTotpImportPromise;
    let totpPopupWindowPromise: Promise<TotpPopupWindow>;
    if (currentTotpPopupWindow === undefined) {
        const popupWindow = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        totpPopupWindowPromise = promptForTotp.promptForTotp(popupWindow.initializePopupWindow);
    } else {
        totpPopupWindowPromise = currentTotpPopupWindow[1]();
    }

    try {
        currentTotpPopupWindow = await totpPopupWindowPromise;
    } catch (e) {
        if (currentPgid !== pgid) {
            return;
        }
        if (e === promptForTotp.RejectReason.TIMEOUT) {
            timeoutCallback();
        } else {
            closeCallback();
        }
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    retryCallback(currentTotpPopupWindow);
}

export const enum SessionTypes {
    MEDIA = 'media',
    NEWS = 'news'
}

export function openImageWindow(baseURL: string, fileName: string, credential: string, sessionType: SessionTypes) {
    setSessionStorage('base-url', baseURL);
    setSessionStorage('file-name', fileName);
    setSessionStorage('title', getTitle());
    setSessionStorage('session-credential', credential);
    setSessionStorage('session-type', sessionType);
    openWindow(TOP_URL + '/image');
    clearSessionStorage();
}