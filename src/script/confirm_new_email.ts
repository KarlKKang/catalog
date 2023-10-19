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
import { expired, emailChanged, emailAlreadyRegistered } from './module/message/template/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from './module/message/template/inline';
import { popupWindowImport, promptForTotpImport } from './module/popup_window';
import { EMAIL_REGEX, PASSWORD_REGEX, handleAuthenticationResult } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

let pageLoaded: boolean;
let destroyPopupWindow: null | (() => void) = null;

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    pageLoaded = true;
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

    sendServerRequest(redirect, 'change_email', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(redirect, expired);
            } else if (response == 'DUPLICATED') {
                showMessage(redirect, emailAlreadyRegistered);
            } else if (response == 'APPROVED') {
                showPage(() => {
                    showPageCallback(redirect, param, signature);
                });
            } else {
                showMessage(redirect);
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function showPageCallback(redirect: RedirectFunc, param: string, signature: string) {
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

        const popupWindowImportPromise = popupWindowImport(redirect);
        const promptForTotpImportPromise = promptForTotpImport(redirect);

        sendChangeEmailRequest(
            'p=' + param + '&signature=' + signature + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password),
            async () => {
                const popupWindowModule = await popupWindowImportPromise;
                const promptForTotp = (await promptForTotpImportPromise).promptForTotp;
                if (!pageLoaded) {
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
        sendServerRequest(redirect, 'change_email', {
            callback: function (response: string) {
                const authenticationResult = handleAuthenticationResult(
                    response,
                    () => {
                        closePopUpWindow?.();
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                    failedTotpCallback,
                    () => {
                        closePopUpWindow?.();
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                    () => {
                        closePopUpWindow?.();
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                );
                if (!authenticationResult) {
                    return;
                }

                if (response == 'EXPIRED') {
                    showMessage(redirect, expired);
                } else if (response == 'DUPLICATED') {
                    showMessage(redirect, emailAlreadyRegistered);
                } else if (response == 'DONE') {
                    showMessage(redirect, emailChanged);
                } else {
                    showMessage(redirect);
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
    pageLoaded = false;
    destroyPopupWindow?.();
}