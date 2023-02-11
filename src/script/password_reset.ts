// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    passwordStyling,
    clearCookies,
    hashPassword,
    disableInput,
    PASSWORD_REGEX,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    getById,
    getBody,
    showElement,
    getBaseURL,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch, passwordUnchanged } from './module/message/template/inline';
import { expired, passwordChanged } from './module/message/template/param';

addEventListener(w, 'load', function () {
    if (getBaseURL() !== LOGIN_URL + '/password_reset') {
        redirect(LOGIN_URL, true);
        return;
    }

    clearCookies();

    const newPasswordInput = getById('new-password') as HTMLInputElement;
    const newPasswordConfirmInput = getById('new-password-confirm') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;

    const user = getURLParam('user');
    const keyID = getURLParam('key-id');
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

    if (keyID === null || !/^[a-zA-Z0-9~_-]+$/.test(keyID)) {
        redirect(LOGIN_URL, true);
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

    sendServerRequest('reset_password.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
                return;
            } else if (response != 'APPROVED') {
                showMessage();
                return;
            }

            addEventListener(newPasswordInput, 'keydown', function (event) {
                if ((event as KeyboardEvent).key === 'Enter') {
                    submitRequest();
                }
            });

            addEventListener(newPasswordConfirmInput, 'keydown', function (event) {
                if ((event as KeyboardEvent).key === 'Enter') {
                    submitRequest();
                }
            });

            addEventListener(submitButton, 'click', function () {
                submitRequest();
            });

            passwordStyling(newPasswordInput);
            passwordStyling(newPasswordConfirmInput);

            showElement(getBody());
        },
        content: 'user=' + user + '&key-id=' + keyID + '&signature=' + signature + '&expires=' + expires,
        withCredentials: false
    });


    async function submitRequest() {
        const warningElem = getById('warning');

        disableAllInputs(true);

        let newPassword = newPasswordInput.value;
        const newPasswordConfirm = newPasswordConfirmInput.value;

        if (!PASSWORD_REGEX.test(newPassword)) {
            warningElem.innerHTML = invalidPasswordFormat;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (newPassword != newPasswordConfirm) {
            warningElem.innerHTML = passwordConfirmationMismatch;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        newPassword = await hashPassword(newPassword);

        sendServerRequest('reset_password.php', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(expired);
                } else if (response == 'SAME') {
                    warningElem.innerHTML = passwordUnchanged;
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(passwordChanged);
                } else {
                    showMessage();
                }
            },
            content: 'user=' + user + '&key-id=' + keyID + '&signature=' + signature + '&expires=' + expires + '&new=' + newPassword,
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newPasswordInput, disabled);
        disableInput(newPasswordConfirmInput, disabled);
    }
});