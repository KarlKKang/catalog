// JavaScript Document
import {
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    passwordStyling,
    clearCookies,
    disableInput,
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
    getBody,
    showElement,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch, passwordUnchanged } from './module/message/template/inline';
import { expired, passwordChanged } from './module/message/template/param';
import { PASSWORD_REGEX } from './module/main/pure';

let newPasswordInput: HTMLInputElement;
let newPasswordConfirmInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    newPasswordInput = getById('new-password') as HTMLInputElement;
    newPasswordConfirmInput = getById('new-password-confirm') as HTMLInputElement;
    submitButton = getById('submit-button') as HTMLButtonElement;
    warningElem = getById('warning');

    const user = getURLParam('user');
    const signature = getURLParam('signature');
    const expires = getURLParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (DEVELOPMENT) {
            showElement(getBody());
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    if (expires === null || !/^[0-9]+$/.test(expires)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('reset_password', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
                return;
            } else if (response != 'APPROVED') {
                showMessage();
                return;
            }

            addEventListener(newPasswordInput, 'keydown', (event) => {
                if ((event as KeyboardEvent).key === 'Enter') {
                    submitRequest(user, signature, expires);
                }
            });

            addEventListener(newPasswordConfirmInput, 'keydown', (event) => {
                if ((event as KeyboardEvent).key === 'Enter') {
                    submitRequest(user, signature, expires);
                }
            });

            addEventListener(submitButton, 'click', () => {
                submitRequest(user, signature, expires);
            });

            passwordStyling(newPasswordInput);
            passwordStyling(newPasswordConfirmInput);

            showElement(getBody());
        },
        content: 'user=' + user + '&signature=' + signature + '&expires=' + expires,
        withCredentials: false
    });
}

async function submitRequest(user: string, signature: string, expires: string) {
    disableAllInputs(true);

    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordConfirmInput.value;

    if (!PASSWORD_REGEX.test(newPassword)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newPassword != newPasswordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('reset_password', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'SAME') {
                replaceText(warningElem, passwordUnchanged);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response === 'PASSWORD INVALID') {
                replaceText(warningElem, invalidPasswordFormat);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DONE') {
                showMessage(passwordChanged);
            } else {
                showMessage();
            }
        },
        content: 'user=' + user + '&signature=' + signature + '&expires=' + expires + '&new=' + encodeURIComponent(newPassword),
        withCredentials: false
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(newPasswordInput, disabled);
    disableInput(newPasswordConfirmInput, disabled);
}