import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
    handleFailedTotp,
} from './module/common';
import { sendServerRequest } from './module/server';
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
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, emailChanged } from './module/message/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from './module/text/body';
import { popupWindowImport, promptForTotpImport } from './module/popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import type { TotpPopupWindow } from './module/popup_window/totp';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { submitButtonText } from './module/text/ui';
import { emailChangePageTitle } from './module/text/page_title';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage(() => {
                showPageCallback('test');
            });
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    sendServerRequest('change_email', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                showPage(() => {
                    showPageCallback(param);
                });
            } else {
                showMessage(invalidResponse());
            }
        },
        content: 'p=' + param,
    });
}

function showPageCallback(param: string) {
    const container = createDivElement();
    container.id = 'portal-form';
    appendChild(body, container);

    const title = createParagraphElement(emailChangePageTitle);
    title.id = 'title';
    appendChild(container, title);

    const note = createParagraphElement('変更を確認するため、変更前のメールアドレスとパスワードを再入力してください。');
    note.id = 'note';
    appendChild(container, note);

    const warningElem = createParagraphElement();
    warningElem.id = 'warning';
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

    const popupWindowImportPromise = popupWindowImport();
    const promptForTotpImportPromise = promptForTotpImport();

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
            callback: async function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        totpPopupWindow?.[2]();
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_FAILED_TOTP:
                        handleFailedTotp(
                            popupWindowImportPromise,
                            promptForTotpImportPromise,
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
                        showMessage(emailChanged);
                        break;
                    default:
                        showMessage(invalidResponse());
                }
            },
            content: content + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
        disableInput(passwordInput, disabled);
    }
}