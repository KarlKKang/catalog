import { handleFailedTotp } from '../module/common';
import { sendServerRequest } from '../module/server';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/common/pure';
import { replaceChildren, replaceText } from '../module/dom';
import { pgid } from '../module/global';
import { accountDeactivated, loginFailed, sessionEnded, tooManyFailedLogin } from '../module/text/message/body';
import type { TotpPopupWindow } from '../module/popup_window/totp';
import { showElement } from '../module/style';
import { disableAllInputs } from './helper';
import { popupWindowImportPromise, promptForTotpImportPromise } from './import_promise';
import { promptForLogin, type LoginPopupWindow } from './login_popup_window';

export function reauthenticationPrompt(
    uri: string,
    callback: (response: string) => boolean,
    warningElem: HTMLElement,
    content?: string,
    directTotpPrompt = false,
    loginPopupWindow?: LoginPopupWindow,
    totpPopupWindow?: TotpPopupWindow,
) {
    if (loginPopupWindow === undefined) {
        handleFailedLogin(
            undefined,
            () => {
                disableAllInputs(false);
            },
            (loginPopupWindow) => {
                reauthenticationPrompt(uri, callback, warningElem, content, directTotpPrompt, loginPopupWindow);
            },
        );
        return;
    }
    const _handleFailedTotp = () => {
        handleFailedTotp(
            popupWindowImportPromise,
            promptForTotpImportPromise,
            totpPopupWindow,
            () => {
                disableAllInputs(false);
            },
            () => {
                handleFailedLogin(
                    undefined,
                    () => {
                        disableAllInputs(false);
                    },
                    (loginPopupWindow) => {
                        reauthenticationPrompt(uri, callback, warningElem, content, directTotpPrompt, loginPopupWindow);
                    },
                    sessionEnded,
                );
            },
            (totpPopupWindow) => {
                reauthenticationPrompt(uri, callback, warningElem, content, directTotpPrompt, loginPopupWindow, totpPopupWindow);
            },
        );
    };
    if (directTotpPrompt && totpPopupWindow === undefined) {
        _handleFailedTotp();
        return;
    }
    sendServerRequest(uri, {
        callback: (response: string) => {
            const closeAll = () => {
                totpPopupWindow?.[2]();
                loginPopupWindow[3]();
            };
            switch (response) {
                case AUTH_DEACTIVATED:
                    replaceChildren(warningElem, ...accountDeactivated());
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_TOO_MANY_REQUESTS:
                    replaceText(warningElem, tooManyFailedLogin);
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_FAILED:
                    handleFailedLogin(
                        totpPopupWindow === undefined ? loginPopupWindow : undefined,
                        () => {
                            disableAllInputs(false);
                        },
                        (loginPopupWindow) => {
                            reauthenticationPrompt(uri, callback, warningElem, content, directTotpPrompt, loginPopupWindow);
                        },
                        loginFailed,
                    );
                    break;
                case AUTH_FAILED_TOTP:
                    _handleFailedTotp();
                    break;
                default:
                    if (callback(response)) {
                        closeAll();
                    }
            }
        },
        content: (content === undefined ? '' : content + '&') + 'email=' + encodeURIComponent(loginPopupWindow[0]) + '&password=' + encodeURIComponent(loginPopupWindow[1]) + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        showSessionEndedMessage: true,
    });
}

export async function handleFailedLogin(
    currentLoginPopupWindow: LoginPopupWindow | undefined,
    closeCallback: () => void,
    retryCallback: (loginPopupWindow: LoginPopupWindow) => void,
    message?: string,
) {
    const currentPgid = pgid;
    let loginPopupWindowPromise: Promise<LoginPopupWindow>;
    if (currentLoginPopupWindow === undefined) {
        const popupWindow = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        loginPopupWindowPromise = promptForLogin(popupWindow.initializePopupWindow, message);
    } else {
        if (message === undefined) {
            message = loginFailed;
        }
        loginPopupWindowPromise = currentLoginPopupWindow[2](message);
    }

    let newLoginPopupWindow: LoginPopupWindow;
    try {
        newLoginPopupWindow = await loginPopupWindowPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            closeCallback();
        }
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    retryCallback(newLoginPopupWindow);
}