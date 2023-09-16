// JavaScript Document
import {
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    passwordStyling,
    disableInput,
    EMAIL_REGEX,
    PASSWORD_REGEX,
    handleAuthenticationResult,
} from './module/main';
import {
    addEventListener,
    redirect,
    showElement,
    getBody,
    getById,
    replaceChildren,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, emailChanged, emailAlreadyRegistered } from './module/message/template/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin } from './module/message/template/inline';
import { promptForTotp } from './module/pop_up_window';

let emailInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    emailInput = getById('email') as HTMLInputElement;
    passwordInput = getById('password') as HTMLInputElement;
    submitButton = getById('submit-button') as HTMLButtonElement;
    warningElem = getById('warning');

    const param = getURLParam('p');
    const signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showElement(getBody());
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
            } else if (response == 'DUPLICATED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'APPROVED') {
                const changeEmailOnKeyDown = (event: Event) => {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        changeEmail(param, signature);
                    }
                };
                addEventListener(emailInput, 'keydown', changeEmailOnKeyDown);
                addEventListener(passwordInput, 'keydown', changeEmailOnKeyDown);
                addEventListener(submitButton, 'click', function () {
                    changeEmail(param, signature);
                });

                passwordStyling(passwordInput);
                showElement(getBody());
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function changeEmail(param: string, signature: string) {
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

    sendChangeEmailRequest(
        'p=' + param + '&signature=' + signature + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password),
        function () {
            promptForTotp(
                function (totp, closeWindow, showWarning) {
                    sendChangeEmailRequest(
                        'p=' + param + '&signature=' + signature + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&totp=' + totp,
                        showWarning,
                        closeWindow
                    );
                },
                function () { disableAllInputs(false); }
            );
        }
    );
}

function sendChangeEmailRequest(content: string, failedTotpCallback: () => void, closePopUpWindow?: () => void) {
    sendServerRequest('change_email', {
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
                showMessage(expired);
            } else if (response == 'DUPLICATED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'DONE') {
                showMessage(emailChanged);
            } else {
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