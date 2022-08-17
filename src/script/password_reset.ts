// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    passwordStyling,
    clearCookies,
    cssVarWrapper,
    hashPassword,
    disableInput
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch } from './module/message/template/inline';
import { expired, passwordChanged } from './module/message/template/param';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();


    if (!getHref().startsWith('https://login.featherine.com/password_reset') && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }


    var newPasswordInput = getById('new-password') as HTMLInputElement;
    var newPasswordConfirmInput = getById('new-password-confirm') as HTMLInputElement;
    var submitButton = getById('submit-button') as HTMLButtonElement;

    var user = getURLParam('user');
    var signature = getURLParam('signature');
    var expires = getURLParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (DEVELOPMENT) {
            removeClass(getBody(), "hidden");
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
                if ((event as KeyboardEvent).key === "Enter") {
                    submitRequest();
                }
            });

            addEventListener(newPasswordConfirmInput, 'keydown', function (event) {
                if ((event as KeyboardEvent).key === "Enter") {
                    submitRequest();
                }
            });

            addEventListener(submitButton, 'click', function () {
                submitRequest();
            });

            passwordStyling(newPasswordInput);
            passwordStyling(newPasswordConfirmInput);

            removeClass(getBody(), "hidden");
        },
        content: "user=" + user + "&signature=" + signature + "&expires=" + expires,
        withCredentials: false
    });


    async function submitRequest() {
        var warningElem = getById('warning');

        disableAllInputs(true);

        var newPassword = newPasswordInput.value;
        var newPasswordConfirm = newPasswordConfirmInput.value;

        if (newPassword == '' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,64}$/.test(newPassword)) {
            warningElem.innerHTML = invalidPasswordFormat;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        } else if (newPassword != newPasswordConfirm) {
            warningElem.innerHTML = passwordConfirmationMismatch;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        newPassword = await hashPassword(newPassword)

        sendServerRequest('reset_password.php', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(expired);
                } else if (response == 'DONE') {
                    showMessage(passwordChanged);
                } else {
                    showMessage();
                }
            },
            content: "user=" + user + "&signature=" + signature + "&expires=" + expires + "&new=" + newPassword,
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newPasswordInput, disabled);
        disableInput(newPasswordConfirmInput, disabled);
    }
});