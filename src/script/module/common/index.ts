import {
    TOP_URL
} from '../env/constant';

import { show as showMessage } from '../message';
import { moduleImportError } from '../message/param';

import {
    w,
    getHash,
    getByIdNative,
    addClass,
    addEventListener,
    appendChild,
    createParagraphElement,
    createDivElement,
    prependChild,
    setSessionStorage,
    getTitle,
    openWindow,
    clearSessionStorage,
    body,
} from '../dom';

import { addTimeout } from '../timer';
import { pgid, redirect } from '../global';
import type { TotpPopupWindow } from '../popup_window/totp';
import type { popupWindowImport, promptForTotpImport } from '../popup_window';

export function getURLParam(name: string): string | null {
    const urlObj = new URL(w.location.href);
    return urlObj.searchParams.get(name);
}

const enum NavBarPage {
    HOME,
    NEWS,
    MY_ACCOUNT,
    INFO,
}

export const NAV_BAR_HOME = NavBarPage.HOME;
export const NAV_BAR_NEWS = NavBarPage.NEWS;
export const NAV_BAR_MY_ACCOUNT = NavBarPage.MY_ACCOUNT;
export const NAV_BAR_INFO = NavBarPage.INFO;

export async function addNavBar(page?: NavBarPage, currentPageCallback?: () => void) {
    const getNavButton = (name: string): [HTMLDivElement, HTMLDivElement] => {
        const container = createDivElement();
        const containerInner = createDivElement();
        const iconContainer = createDivElement();
        addClass(iconContainer, 'icon');
        const nameContainer = createParagraphElement(name);
        appendChild(containerInner, iconContainer);
        appendChild(containerInner, nameContainer);
        appendChild(container, containerInner);
        return [container, iconContainer];
    };

    const navButton1 = getNavButton('ホーム');
    const navButton2 = getNavButton('お知らせ');
    const navButton3 = getNavButton('マイページ');
    const navButton4 = getNavButton('ご利用ガイド');

    const navBar = createDivElement();
    navBar.id = 'nav-bar';
    prependChild(body, navBar);
    appendChild(navBar, navButton1[0]);
    appendChild(navBar, navButton2[0]);
    appendChild(navBar, navButton3[0]);
    appendChild(navBar, navButton4[0]);

    const callback = () => {
        if (currentPageCallback !== undefined) {
            currentPageCallback();
            return true;
        }
        if (w.scrollY === 0) {
            return false;
        }
        scrollToTop();
        return true;
    };

    addEventListener(navButton1[0], 'click', () => {
        if (page === NavBarPage.HOME) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL);
    });

    addEventListener(navButton2[0], 'click', () => {
        if (page === NavBarPage.NEWS) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/news/');
    });

    addEventListener(navButton3[0], 'click', () => {
        if (page === NavBarPage.MY_ACCOUNT) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/my_account');
    });

    addEventListener(navButton4[0], 'click', () => {
        if (page === NavBarPage.INFO) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/info');
    });

    const navBarPadding = createDivElement();
    navBarPadding.id = 'nav-bar-padding';
    appendChild(body, navBarPadding);

    let icons: typeof import(
        './icons'
    );
    const currentPgid = pgid;
    try {
        icons = await import(
            './icons'
        );
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    appendChild(navButton1[1], page === NavBarPage.HOME ? icons.getHomeFillIcon() : icons.getHomeIcon());
    appendChild(navButton2[1], page === NavBarPage.NEWS ? icons.getNewsFillIcon() : icons.getNewsIcon());
    appendChild(navButton3[1], page === NavBarPage.MY_ACCOUNT ? icons.getMyAccountFillIcon() : icons.getMyAccountIcon());
    appendChild(navButton4[1], page === NavBarPage.INFO ? icons.getInfoFillIcon() : icons.getInfoIcon());
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
        if (e === promptForTotp.TOTP_POPUP_WINDOW_TIMEOUT) {
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

const enum _SessionTypes {
    MEDIA = 'media',
    NEWS = 'news'
}

export const SESSION_TYPE_MEDIA = _SessionTypes.MEDIA;
export const SESSION_TYPE_NEWS = _SessionTypes.NEWS;
export type SessionTypes = _SessionTypes;

export function openImageWindow(baseURL: string, fileName: string, credential: string, sessionType: SessionTypes) {
    setSessionStorage('base-url', baseURL);
    setSessionStorage('file-name', fileName);
    setSessionStorage('title', getTitle());
    setSessionStorage('session-credential', credential);
    setSessionStorage('session-type', sessionType);
    openWindow(TOP_URL + '/image');
    clearSessionStorage();
}