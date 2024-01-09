import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
    sendServerRequest,
    passwordStyling,
    disableInput,
} from './module/common';
import {
    addEventListener,
    getById,
    getByClassAt,
    openWindow,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, registerComplete, emailAlreadyRegistered } from './module/message/template/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameTaken } from './module/message/template/inline';
import { PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/message/template/param/server';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    const signature = getURLParam('signature');

    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage(addInfoRedirects);
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('register', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response === 'APPROVED') {
                showPage(() => { showPageCallback(param, signature); });
            } else {
                showMessage(invalidResponse());
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function showPageCallback(param: string, signature: string) {
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const usernameInput = getById('username') as HTMLInputElement;
    const passwordInput = getById('password') as HTMLInputElement;
    const passwordConfirmInput = getById('password-confirm') as HTMLInputElement;
    const warningElem = getById('warning');

    addEventListener(usernameInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });
    addEventListener(passwordInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });
    addEventListener(passwordConfirmInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });

    addInfoRedirects();

    addEventListener(submitButton, 'click', () => {
        register();
    });

    passwordStyling(passwordInput);
    passwordStyling(passwordConfirmInput);

    function register() {
        disableAllInputs(true);

        const username = usernameInput.value;
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (username === '') {
            replaceText(warningElem, usernameEmpty);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            replaceText(warningElem, invalidPasswordFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (password !== passwordConfirm) {
            replaceText(warningElem, passwordConfirmationMismatch);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('register', {
            callback: function (response: string) {
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'USERNAME DUPLICATED') {
                    replaceText(warningElem, usernameTaken);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'USERNAME EMPTY') {
                    replaceText(warningElem, usernameEmpty);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'PASSWORD INVALID') {
                    replaceText(warningElem, invalidPasswordFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'ALREADY REGISTERED') {
                    showMessage(emailAlreadyRegistered);
                } else if (response === 'DONE') {
                    showMessage(registerComplete);
                } else {
                    showMessage(invalidResponse());
                }
            },
            content: 'p=' + param + '&signature=' + signature + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(usernameInput, disabled);
        disableInput(passwordInput, disabled);
        disableInput(passwordConfirmInput, disabled);
    }
}

function addInfoRedirects() {
    addEventListener(getByClassAt('link', 0), 'click', () => {
        openWindow('info');
    });
    addEventListener(getByClassAt('link', 1), 'click', () => {
        openWindow('info#en');
    });
    addEventListener(getByClassAt('link', 2), 'click', () => {
        openWindow('info#zh-Hant');
    });
    addEventListener(getByClassAt('link', 3), 'click', () => {
        openWindow('info#zh-Hans');
    });
}