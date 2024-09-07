import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { AUTH_TOO_MANY_REQUESTS } from '../module/auth_result/too_many_requests';
import { AUTH_DEACTIVATED } from '../module/auth_result/deactivated';
import { AUTH_FAILED_TOTP } from '../module/auth_result/failed_totp';
import { AUTH_FAILED } from '../module/auth_result/failed';
import { joinHttpForms } from '../module/string/http_form/join';
import { buildHttpForm } from '../module/string/http_form/build';
import { replaceChildren } from '../module/dom/node/replace_children';
import { replaceText } from '../module/dom/element/text/replace';
import { pgid } from '../module/global/pgid';
import { sessionEnded } from '../module/text/misc/session_ended';
import { accountDeactivated } from '../module/text/auth/deactivated';
import { tooManyFailedLogin } from '../module/text/auth/too_many_failed';
import { loginFailed } from '../module/text/auth/failed';
import { TotpPopupWindowKey, handleFailedTotp, type TotpPopupWindow } from '../module/popup_window/totp';
import { showElement } from '../module/style/show_element';
import { promptForLogin, type LoginPopupWindow, LoginPopupWindowKey } from './login_popup_window';

export function reauthenticationPrompt(
    uri: string,
    callback: (response: string) => boolean,
    disableAllInputs: (disable: boolean) => void,
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
                reauthenticationPrompt(uri, callback, disableAllInputs, warningElem, content, directTotpPrompt, loginPopupWindow);
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
                        reauthenticationPrompt(uri, callback, disableAllInputs, warningElem, content, directTotpPrompt, loginPopupWindow);
                    },
                    sessionEnded,
                );
            },
            (totpPopupWindow) => {
                reauthenticationPrompt(uri, callback, disableAllInputs, warningElem, content, directTotpPrompt, loginPopupWindow, totpPopupWindow);
            },
        );
    };
    if (directTotpPrompt && totpPopupWindow === undefined) {
        _handleFailedTotp();
        return;
    }
    sendServerRequest(uri, {
        [ServerRequestOptionKey.CALLBACK]: (response: string) => {
            const closeAll = () => {
                totpPopupWindow?.[TotpPopupWindowKey.CLOSE]();
                loginPopupWindow[LoginPopupWindowKey.CLOSE]();
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
                            reauthenticationPrompt(uri, callback, disableAllInputs, warningElem, content, directTotpPrompt, loginPopupWindow);
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
        [ServerRequestOptionKey.CONTENT]: joinHttpForms(
            content,
            buildHttpForm({
                email: loginPopupWindow[LoginPopupWindowKey.EMAIL],
                password: loginPopupWindow[LoginPopupWindowKey.PASSWORD],
                totp: totpPopupWindow?.[TotpPopupWindowKey.TOTP],
            }),
        ),
        [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
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
        loginPopupWindowPromise = currentLoginPopupWindow[LoginPopupWindowKey.SHOW_WARNING](message);
    }

    let newLoginPopupWindow: LoginPopupWindow;
    try {
        newLoginPopupWindow = await loginPopupWindowPromise;
    } catch {
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
