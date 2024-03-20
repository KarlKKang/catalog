import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
} from './module/common';
import { sendServerRequest } from './module/server';
import {
    addEventListener,
    replaceText,
    clearSessionStorage,
    passwordStyling,
    disableInput,
    createDivElement,
    appendChild,
    body,
    createParagraphElement,
    createPasswordInput,
    createButtonElement,
    createUListElement,
    appendListItems,
    addClass,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidPasswordFormat, passwordConfirmationMismatch, passwordUnchanged } from './module/text/message/body';
import { expired, passwordChanged } from './module/message/param';
import { PASSWORD_REGEX } from './module/common/pure';
import { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { passwordResetPageTitle } from './module/text/page_title';
import { changeButtonText, passwordRules } from './module/text/ui';

import * as styles from '../css/portal_form.module.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const user = getURLParam('user');
    const signature = getURLParam('signature');
    const expires = getURLParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (DEVELOPMENT) {
            showPage();
            showPageCallback('test', 'test', 'test');
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
            showPage();
            showPageCallback(user, signature, expires);
        },
        content: 'user=' + user + '&signature=' + signature + '&expires=' + expires,
    });
}

function showPageCallback(user: string, signature: string, expires: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(passwordResetPageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [newPasswordContainer, newPasswordInput] = createPasswordInput(true, '新しいパスワード');
    horizontalCenter(newPasswordContainer);
    appendChild(container, newPasswordContainer);

    const [newPasswordConfirmContainer, newPasswordConfirmInput] = createPasswordInput(true, '確認再入力');
    horizontalCenter(newPasswordConfirmContainer);
    appendChild(container, newPasswordConfirmContainer);

    const submitButton = createButtonElement(changeButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const note = createDivElement();
    addClass(note, styles.note);
    const noteList = createUListElement();
    appendListItems(noteList, ...passwordRules);
    appendChild(note, noteList);
    appendChild(container, note);

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