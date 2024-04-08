import { handleFailedTotp } from '../module/common';
import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/common/pure';
import { replaceChildren, replaceText } from '../module/dom';
import { pgid } from '../module/global';
import { accountDeactivated, loginFailed, sessionEnded, tooManyFailedLogin } from '../module/text/message/body';
import type { TotpPopupWindow } from '../module/popup_window/totp';
import { showElement } from '../module/style';
import { disableAllInputs } from './helper';
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
        [ServerRequestOptionProp.CALLBACK]: (response: string) => {
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
        [ServerRequestOptionProp.CONTENT]: (content === undefined ? '' : content + '&') + 'email=' + encodeURIComponent(loginPopupWindow[0]) + '&password=' + encodeURIComponent(loginPopupWindow[1]) + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
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
        loginPopupWindowPromise = promptForLogin(message);
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