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
    getByClassAt,
    openWindow,
    replaceText,
    clearSessionStorage,
    passwordStyling,
    disableInput,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, registerComplete, emailAlreadyRegistered } from './module/message/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameInvalid, usernameTaken } from './module/text/body';
import { PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { showElement } from './module/style';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage(addInfoRedirects);
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    sendServerRequest('register', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response === 'APPROVED') {
                showPage(() => { showPageCallback(param); });
            } else {
                showMessage(invalidResponse());
            }
        },
        content: 'p=' + param,
    });
}

function showPageCallback(param: string) {
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
                const showInlineMessage = (message: string) => {
                    replaceText(warningElem, message);
                    showElement(warningElem);
                    disableAllInputs(false);
                };
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'USERNAME DUPLICATED') {
                    showInlineMessage(usernameTaken);
                } else if (response === 'USERNAME EMPTY') {
                    showInlineMessage(usernameEmpty);
                } else if (response === 'USERNAME INVALID') {
                    showInlineMessage(usernameInvalid);
                } else if (response === 'PASSWORD INVALID') {
                    showInlineMessage(invalidPasswordFormat);
                } else if (response === 'ALREADY REGISTERED') {
                    showMessage(emailAlreadyRegistered);
                } else if (response === 'DONE') {
                    showMessage(registerComplete);
                } else {
                    showMessage(invalidResponse());
                }
            },
            content: 'p=' + param + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
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