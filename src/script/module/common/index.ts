import {
    SERVER_URL,
    TOP_URL,
    LOGIN_URL
} from '../env/constant';

import { show as showMessage } from '../message';
import { moduleImportError, insufficientPermissions } from '../message/template/param';
import { mediaSessionEnded, connectionError, notFound, status429, status503, status400And500, invalidResponse, sessionEnded, unknownServerError } from '../message/template/param/server';

import {
    w,
    getHash,
    getByIdNative,
    addClass,
    removeClass,
    getParentElement,
    addEventListener,
    appendChild,
    createParagraphElement,
    createDivElement,
    prependChild,
    removeAllEventListeners,
    setSessionStorage,
    getTitle,
    openWindow,
    clearSessionStorage,
    body,
} from '../dom';

import * as MaintenanceInfo from '../type/MaintenanceInfo';
import { addTimeout } from '../timer';
import { pgid, redirect } from '../global';
import type { TotpPopupWindow } from '../popup_window/totp';
import type { popupWindowImport, promptForTotpImport } from '../popup_window';

//////////////////////////////////////// Helper functions ////////////////////////////////////////

export function getURLParam(name: string): string | null {
    const urlObj = new URL(w.location.href);
    return urlObj.searchParams.get(name);
}

interface SendServerRequestOption {
    callback?: (response: string) => void | Promise<void>;
    content?: string;
    method?: 'POST' | 'GET';
    logoutParam?: string | undefined;
    connectionErrorRetry?: number | undefined;
    connectionErrorRetryTimeout?: number;
    showSessionEndedMessage?: boolean;
}

function xhrOnErrorCallback(uri: string, options: SendServerRequestOption) {
    if (options.connectionErrorRetry === undefined) {
        options.connectionErrorRetry = 2;
    } else {
        options.connectionErrorRetry -= 1;
    }

    if (options.connectionErrorRetryTimeout === undefined) {
        options.connectionErrorRetryTimeout = 500;
    } else {
        options.connectionErrorRetryTimeout *= 2;
    }

    if (options.connectionErrorRetry < 0) {
        showMessage(connectionError);
    } else {
        addTimeout(() => {
            sendServerRequest(uri, options);
        }, options.connectionErrorRetryTimeout);
    }
}

function checkXHRStatus(response: XMLHttpRequest, uri: string, options: SendServerRequestOption): boolean {
    const status = response.status;
    const responseText = response.responseText;
    if (status === 200) {
        return true;
    } else if (status === 403) {
        if (responseText === 'SESSION ENDED') {
            showMessage(mediaSessionEnded);
        } else if (responseText === 'INSUFFICIENT PERMISSIONS') {
            showMessage(insufficientPermissions);
        } else if (responseText === 'UNAUTHORIZED') {
            const logoutParam = options.logoutParam;
            const url = LOGIN_URL + ((logoutParam === undefined || logoutParam === '') ? '' : ('?' + logoutParam));
            if (options.showSessionEndedMessage) {
                showMessage(sessionEnded(url));
            } else {
                redirect(url, true);
            }
        } else {
            xhrOnErrorCallback(uri, options);
        }
    } else if (status === 429) {
        showMessage(status429);
    } else if (status === 503) {
        let parsedResponse: MaintenanceInfo.MaintenanceInfo;
        try {
            parsedResponse = JSON.parse(responseText);
            MaintenanceInfo.check(parsedResponse);
        } catch (e) {
            showMessage(invalidResponse());
            return false;
        }
        showMessage(status503(parsedResponse));
    } else if (status === 500 || status === 400) {
        if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
            showMessage(status400And500(responseText));
        } else {
            showMessage(unknownServerError());
        }
    } else if (status === 404 && response.responseText === 'REJECTED') {
        showMessage(notFound);
    } else {
        xhrOnErrorCallback(uri, options);
    }
    return false;
}

export function sendServerRequest(uri: string, options: SendServerRequestOption): XMLHttpRequest {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open(options.method ?? 'POST', SERVER_URL + '/' + uri, true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.withCredentials = true;

    addEventListener(xmlhttp, 'error', () => {
        removeAllEventListeners(xmlhttp);
        xhrOnErrorCallback(uri, options);
    });
    addEventListener(xmlhttp, 'abort', () => {
        removeAllEventListeners(xmlhttp);
    });
    addEventListener(xmlhttp, 'load', () => {
        removeAllEventListeners(xmlhttp);
        if (checkXHRStatus(xmlhttp, uri, options)) {
            options.callback && options.callback(xmlhttp.responseText);
        }
    });

    xmlhttp.send(options.content ?? '');
    return xmlhttp;
}

export function authenticate(callback: { successful?: () => void; failed?: () => void }) {
    sendServerRequest('get_authentication_state', {
        callback: function (response: string) {
            if (response === 'APPROVED') {
                callback.successful && callback.successful();
            } else if (response === 'FAILED') {
                callback.failed && callback.failed();
            } else {
                showMessage(invalidResponse());
            }
        }
    });
}

export function logout(callback: () => void,) {
    sendServerRequest('logout', {
        callback: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (DEVELOPMENT) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage(invalidResponse());
            }
        }
    });
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

export function changeColor(elem: HTMLElement, color: string | null) {
    removeClass(elem, 'color-red');
    removeClass(elem, 'color-green');
    removeClass(elem, 'color-orange');
    color && addClass(elem, 'color-' + color);
}

export function disableInput(inputElement: HTMLInputElement, disabled: boolean) {
    inputElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(inputElement), 'disabled');
    } else {
        removeClass(getParentElement(inputElement), 'disabled');
    }
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

export function setUpSessionAuthentication(credential: string, logoutParam?: string) {
    addTimeout(() => {
        sendServerRequest('authenticate_media_session', {
            callback: function (response: string) {
                if (response === 'APPROVED') {
                    setUpSessionAuthentication(credential, logoutParam);
                    return;
                }
                showMessage(invalidResponse());
            },
            content: credential,
            logoutParam: logoutParam,
            connectionErrorRetry: 5,
            showSessionEndedMessage: true,
        });
    }, 40 * 1000); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
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