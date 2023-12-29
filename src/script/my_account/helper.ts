import { changeColor, disableInput, handleFailedTotp, sendServerRequest } from '../module/common';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/common/pure';
import { addClass, hideElement, removeClass, replaceChildren, replaceText, showElement } from '../module/dom';
import { pgid } from '../module/global';
import { accountDeactivated, disableButtonText, enableButtonText, loginFailed, loginNotificationIsDisabled, loginNotificationIsEnabled, mfaNotSet, sessionEnded, tooManyFailedLogin } from '../module/message/template/inline';
import type { TotpPopupWindow } from '../module/popup_window/totp';
import { popupWindowImportPromise, promptForTotpImportPromise } from './import_promise';
import { promptForLogin, type LoginPopupWindow } from './login_popup_window';
import { SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS, SHARED_VAR_IDX_CURRENT_MFA_STATUS, SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, SHARED_VAR_IDX_INVITE_BUTTON, SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO, SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, SHARED_VAR_IDX_LOGOUT_BUTTON, SHARED_VAR_IDX_MFA_BUTTON, SHARED_VAR_IDX_MFA_INFO, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_RECOVERY_CODE_WARNING, SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON, getSharedBool, getSharedButton, getSharedElement, getSharedInput, setCurrentLoginNotificationStatus, setCurrentMfaStatus } from './shared_var';

export function changeMfaStatus(newStatus: boolean) {
    setCurrentMfaStatus(newStatus);
    const mfaInfo = getSharedElement(SHARED_VAR_IDX_MFA_INFO);
    const mfaButton = getSharedButton(SHARED_VAR_IDX_MFA_BUTTON);
    const recoveryCodeInfo = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO);
    const recoveryCodeButton = getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON);
    const loginNotificationInfo = getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO);
    const loginNotificationButton = getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON);
    if (newStatus) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, disableButtonText);

        hideElement(recoveryCodeInfo);
        recoveryCodeButton.disabled = false;
        removeClass(recoveryCodeButton, 'not-allowed');

        const currentLoginNotificationStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS);
        replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationIsEnabled : loginNotificationIsDisabled);
        replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : enableButtonText);
        loginNotificationButton.disabled = false;
        removeClass(loginNotificationButton, 'not-allowed');
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');

        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_WARNING));
        recoveryCodeButton.disabled = true;
        addClass(recoveryCodeButton, 'not-allowed');

        setCurrentLoginNotificationStatus(true);
        replaceText(loginNotificationInfo, loginNotificationIsEnabled + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING));
        loginNotificationButton.disabled = true;
        addClass(loginNotificationButton, 'not-allowed');
    }
}

export function disableAllInputs(disabled: boolean) {
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT), disabled);

    getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_MFA_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_INVITE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_LOGOUT_BUTTON).disabled = disabled;

    const currentMfaStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS);
    getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON).disabled = disabled || !currentMfaStatus;
    getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON).disabled = disabled || !currentMfaStatus;
}

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