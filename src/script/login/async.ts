import {
    TOP_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    ServerRequestOptionProp
} from '../module/server';
import {
    addEventListener,
    replaceChildren,
    replaceText,
    passwordStyling,
    disableInput,
    createDivElement,
    createElement,
    addClass,
    appendChild,
    createParagraphElement,
    createInputElement,
    body,
    createButtonElement,
    createEmailInput,
    createPasswordInput,
    createSpanElement,
    getParentElement,
    removeClass,
} from '../module/dom';
import { showMessage } from '../module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from '../module/text/message/body';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import { pgid, redirect } from '../module/global';
import { handleFailedTotp, TotpPopupWindowKey, type TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/server/message';
import { hideElement, horizontalCenter, showElement } from '../module/style';
import { forgetPasswordText } from '../module/text/ui';
import * as commonStyles from '../../css/common.module.scss';
import * as formStyles from '../../css/portal_form.module.scss';
import * as styles from '../../css/login.module.scss';
import { offloadPopupWindow } from '../module/popup_window/core';
import { importModule } from '../module/import_module';

export default function (
    approvedCallbackPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './approved_callback'
    )>
) {
    const container = createDivElement();
    addClass(container, formStyles.container);
    appendChild(body, container);

    const title = createParagraphElement('ようこそ');
    addClass(title, formStyles.title);
    appendChild(container, title);

    const warningElem = createParagraphElement();
    addClass(warningElem, formStyles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [emailContainer, emailInput] = createEmailInput();
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const [passwordContainer, passwordInput] = createPasswordInput(false);
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const [rememberMeContainer, rememberMeInput] = getRememberMeCheckbox();
    appendChild(container, rememberMeContainer);

    const submitButton = createButtonElement('ログイン');
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const forgetPassword = createParagraphElement();
    const forgetPasswordLink = createSpanElement(forgetPasswordText);
    addClass(forgetPasswordLink, commonStyles.link);
    appendChild(forgetPassword, forgetPasswordLink);
    appendChild(container, forgetPassword);

    const loginOnKeyDown = (event: Event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            login();
        }
    };

    addEventListener(emailInput, 'keydown', loginOnKeyDown);
    addEventListener(passwordInput, 'keydown', loginOnKeyDown);

    addEventListener(submitButton, 'click', login);
    addEventListener(forgetPasswordLink, 'click', () => {
        redirect(TOP_URL + '/request_password_reset', true);
    });
    passwordStyling(passwordInput);

    function login() {
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

        sendLoginRequest('email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&remember_me=' + (rememberMeInput.checked ? '1' : '0'));
    }

    function sendLoginRequest(content: string, totpPopupWindow?: TotpPopupWindow) {
        sendServerRequest('login', {
            [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        totpPopupWindow?.[TotpPopupWindowKey.CLOSE]();
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
                                sendLoginRequest(content, totpPopupWindow);
                            }
                        );
                        break;
                    case AUTH_DEACTIVATED:
                        totpPopupWindow?.[TotpPopupWindowKey.CLOSE]();
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_TOO_MANY_REQUESTS:
                        totpPopupWindow?.[TotpPopupWindowKey.CLOSE]();
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case 'APPROVED': {
                        const currentPgid = pgid;
                        const approvedCallback = await importModule(approvedCallbackPromise);
                        if (currentPgid === pgid) {
                            approvedCallback.default();
                        }
                        break;
                    }
                    default:
                        showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: content + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[TotpPopupWindowKey.TOTP]),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(passwordInput, disabled);
        disableInput(emailInput, disabled);
        disableCheckbox(rememberMeInput, disabled);
    }
}

function getRememberMeCheckbox() {
    const container = createDivElement();
    addClass(container, styles.rememberMe);

    const label = createElement('label') as HTMLLabelElement;
    addClass(label, styles.checkboxContainer);

    appendChild(label, createParagraphElement('ログインしたままにする'));

    const input = createInputElement('checkbox');
    appendChild(label, input);

    const checkmark = createDivElement();
    addClass(checkmark, styles.checkmark);
    appendChild(label, checkmark);

    appendChild(container, label);
    return [container, input] as const;
}

function disableCheckbox(checkbox: HTMLInputElement, disabled: boolean) {
    checkbox.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(checkbox), styles.disabled);
    } else {
        removeClass(getParentElement(checkbox), styles.disabled);
    }
}

export function offload() {
    offloadPopupWindow();
}