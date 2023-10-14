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
    getById,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch, passwordUnchanged } from './module/message/template/inline';
import { expired, passwordChanged } from './module/message/template/param';
import { PASSWORD_REGEX } from './module/common/pure';
import { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    const user = getURLParam('user');
    const signature = getURLParam('signature');
    const expires = getURLParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (DEVELOPMENT) {
            showPage();
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

    sendServerRequest(redirect, 'reset_password', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(redirect, expired);
                return;
            } else if (response != 'APPROVED') {
                showMessage(redirect);
                return;
            }

            showPage(() => { showPageCallback(redirect, user, signature, expires); });
        },
        content: 'user=' + user + '&signature=' + signature + '&expires=' + expires,
        withCredentials: false
    });
}

function showPageCallback(redirect: RedirectFunc, user: string, signature: string, expires: string) {
    const newPasswordInput = getById('new-password') as HTMLInputElement;
    const newPasswordConfirmInput = getById('new-password-confirm') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const warningElem = getById('warning');

    addEventListener(newPasswordInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(newPasswordConfirmInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(submitButton, 'click', () => {
        submitRequest();
    });

    passwordStyling(newPasswordInput);
    passwordStyling(newPasswordConfirmInput);

    function submitRequest() {
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

        sendServerRequest(redirect, 'reset_password', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(redirect, expired);
                } else if (response == 'SAME') {
                    replaceText(warningElem, passwordUnchanged);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'PASSWORD INVALID') {
                    replaceText(warningElem, invalidPasswordFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(redirect, passwordChanged);
                } else {
                    showMessage(redirect);
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
}