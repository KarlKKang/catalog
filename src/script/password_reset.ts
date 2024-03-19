import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
} from './module/common';
import { sendServerRequest } from './module/server';
import {
    addEventListener,
    getById,
    replaceText,
    clearSessionStorage,
    passwordStyling,
    disableInput,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch, passwordUnchanged } from './module/message/template/inline';
import { expired, passwordChanged } from './module/message/template/param';
import { PASSWORD_REGEX } from './module/common/pure';
import { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { showElement } from './module/style';

export default function (showPage: ShowPageFunc) {
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

    sendServerRequest('reset_password', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
                return;
            } else if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }

            showPage(() => { showPageCallback(user, signature, expires); });
        },
        content: 'user=' + user + '&signature=' + signature + '&expires=' + expires,
    });
}

function showPageCallback(user: string, signature: string, expires: string) {
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
        } else if (newPassword !== newPasswordConfirm) {
            replaceText(warningElem, passwordConfirmationMismatch);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('reset_password', {
            callback: function (response: string) {
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'SAME') {
                    replaceText(warningElem, passwordUnchanged);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'PASSWORD INVALID') {
                    replaceText(warningElem, invalidPasswordFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'DONE') {
                    showMessage(passwordChanged);
                } else {
                    showMessage(invalidResponse());
                }
            },
            content: 'user=' + user + '&signature=' + signature + '&expires=' + expires + '&new=' + encodeURIComponent(newPassword),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newPasswordInput, disabled);
        disableInput(newPasswordConfirmInput, disabled);
    }
}