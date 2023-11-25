import {
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    passwordStyling,
    disableInput,
} from './module/common';
import {
    addEventListener,
    showElement,
    getById,
    replaceChildren,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, emailChanged } from './module/message/template/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from './module/message/template/inline';
import { popupWindowImport, promptForTotpImport } from './module/popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { pgid, redirect } from './module/global';

let destroyPopupWindow: null | (() => void) = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    const signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage();
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }
    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('change_email', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'APPROVED') {
                showPage(() => {
                    showPageCallback(param, signature);
                });
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function showPageCallback(param: string, signature: string) {
    const emailInput = getById('email') as HTMLInputElement;
    const passwordInput = getById('password') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const warningElem = getById('warning');

    const changeEmailOnKeyDown = (event: Event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            changeEmail();
        }
    };
    addEventListener(emailInput, 'keydown', changeEmailOnKeyDown);
    addEventListener(passwordInput, 'keydown', changeEmailOnKeyDown);
    addEventListener(submitButton, 'click', () => {
        changeEmail();
    });

    passwordStyling(passwordInput);

    function changeEmail() {
        disableAllInputs(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!EMAIL_REGEX.test(email)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        const popupWindowImportPromise = popupWindowImport();
        const promptForTotpImportPromise = promptForTotpImport();

        sendChangeEmailRequest(
            'p=' + param + '&signature=' + signature + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password),
            async () => {
                const currentPgid = pgid;
                const popupWindowModule = await popupWindowImportPromise;
                const promptForTotp = (await promptForTotpImportPromise).promptForTotp;
                if (currentPgid !== pgid) {
                    return;
                }
                destroyPopupWindow = popupWindowModule.destroy;

                promptForTotp(
                    popupWindowModule.initializePopupWindow,
                    (totp, closeWindow, showWarning) => {
                        sendChangeEmailRequest(
                            'p=' + param + '&signature=' + signature + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&totp=' + totp,
                            showWarning,
                            closeWindow
                        );
                    },
                    () => { disableAllInputs(false); },
                    () => {
                        emailInput.value = '';
                        passwordInput.value = '';
                        replaceText(warningElem, sessionEnded);
                        showElement(warningElem);
                    }
                );
            }
        );
    }

    function sendChangeEmailRequest(content: string, failedTotpCallback: () => void, closePopUpWindow?: () => void) {
        sendServerRequest('change_email', {
            callback: function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        closePopUpWindow?.();
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_FAILED_TOTP:
                        failedTotpCallback();
                        break;
                    case AUTH_DEACTIVATED:
                        closePopUpWindow?.();
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_TOO_MANY_REQUESTS:
                        closePopUpWindow?.();
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case 'EXPIRED':
                        showMessage(expired);
                        break;
                    case 'DONE':
                        showMessage(emailChanged);
                        break;
                    default:
                        showMessage();
                }
            },
            content: content
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
        disableInput(passwordInput, disabled);
    }
}

export function offload() {
    destroyPopupWindow?.();
}