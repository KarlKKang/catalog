import {
    LOGIN_URL, TOP_URL,
} from './module/env/constant';
import {
    getURLParam,
    handleFailedTotp,
} from './module/common';
import { ServerRequestOptionProp, sendServerRequest } from './module/server';
import {
    addEventListener,
    replaceChildren,
    replaceText,
    clearSessionStorage,
    createDivElement,
    appendChild,
    createParagraphElement,
    createEmailInput,
    createPasswordInput,
    createButtonElement,
    body,
    disableInput,
    addClass,
} from './module/dom';
import { showMessage } from './module/message';
import { expired } from './module/message/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from './module/text/message/body';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from './module/common/pure';
import { redirect, type ShowPageFunc } from './module/global';
import type { TotpPopupWindow } from './module/popup_window/totp';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { submitButtonText } from './module/text/ui';
import { emailChangePageTitle } from './module/text/page_title';
import * as styles from '../css/portal_form.module.scss';
import { completed } from './module/text/message/title';
import { CSS_COLOR } from './module/style/value';
import { MessageParamProp } from './module/message/type';
import { offloadPopupWindow } from './module/popup_window/core';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage();
            showPageCallback('test');
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    sendServerRequest('change_email', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                showPage();
                showPageCallback(param);
            } else {
                showMessage(invalidResponse());
            }
        },
        [ServerRequestOptionProp.CONTENT]: 'p=' + param,
    });
}

function showPageCallback(param: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(emailChangePageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const note = createParagraphElement('変更を確認するため、変更前のメールアドレスとパスワードを再入力してください。');
    addClass(note, styles.note);
    appendChild(container, note);

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [emailContainer, emailInput] = createEmailInput();
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const [passwordContainer, passwordInput] = createPasswordInput(false);
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const submitButton = createButtonElement(submitButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

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

        sendChangeEmailRequest('p=' + param + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password));
    }

    function sendChangeEmailRequest(content: string, totpPopupWindow?: TotpPopupWindow) {
        sendServerRequest('change_email', {
            [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        totpPopupWindow?.[2]();
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_FAILED_TOTP:
                        handleFailedTotp(
                            totpPopupWindow,
                            () => {
                                disableAllInputs(false);
                            },
                            () => {
                                disableAllInputs(false);
                                emailInput.value = '';
                                passwordInput.value = '';
                                replaceText(warningElem, sessionEnded);
                                showElement(warningElem);
                            },
                            (totpPopupWindow: TotpPopupWindow) => {
                                sendChangeEmailRequest(content, totpPopupWindow);
                            }
                        );
                        break;
                    case AUTH_DEACTIVATED:
                        totpPopupWindow?.[2]();
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_TOO_MANY_REQUESTS:
                        totpPopupWindow?.[2]();
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case 'EXPIRED':
                        showMessage(expired);
                        break;
                    case 'DONE':
                        showMessage({
                            [MessageParamProp.TITLE]: completed,
                            [MessageParamProp.MESSAGE]: 'メールアドレスが変更されました。',
                            [MessageParamProp.COLOR]: CSS_COLOR.GREEN,
                            [MessageParamProp.URL]: TOP_URL,
                            [MessageParamProp.BUTTON_TEXT]: 'トップページへ'
                        });
                        break;
                    default:
                        showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: content + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
        disableInput(passwordInput, disabled);
    }
}

export function offload() {
    offloadPopupWindow();
}