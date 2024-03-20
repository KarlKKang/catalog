import {
    TOP_URL,
} from '../module/env/constant';
import {
    handleFailedTotp,
} from '../module/common';
import {
    sendServerRequest,
    authenticate
} from '../module/server';
import {
    addEventListener,
    replaceChildren,
    replaceText,
    clearSessionStorage,
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
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from '../module/text/message/body';
import { moduleImportError } from '../module/message/param';
import { popupWindowImport, promptForTotpImport } from '../module/popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid, redirect } from '../module/global';
import type { TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/server/message';
import { hideElement, horizontalCenter, showElement } from '../module/style';
import { forgetPasswordText, keepLoggedInText, loginButtonText, welcomeText } from '../module/text/ui';

import * as formStyles from '../../css/portal_form.module.scss';
import '../../css/login.scss';

let onDemandImportPromise: Promise<typeof import(
    './on_demand'
)>;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                showPage();
                showPageCallback();
            }
    });
    onDemandImportPromise = import('./on_demand');
}

function showPageCallback() {
    const container = createDivElement();
    addClass(container, formStyles.container);
    appendChild(body, container);

    const title = createParagraphElement(welcomeText);
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

    const submitButton = createButtonElement(loginButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const forgetPassword = createParagraphElement();
    const forgetPasswordLink = createSpanElement(forgetPasswordText);
    addClass(forgetPasswordLink, 'link');
    appendChild(forgetPassword, forgetPasswordLink);
    appendChild(container, forgetPassword);

    const popupWindowImportPromise = popupWindowImport();
    const promptForTotpImportPromise = promptForTotpImport();

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
            callback: async function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        totpPopupWindow?.[2];
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
                                sendLoginRequest(content, totpPopupWindow);
                            }
                        );
                        break;
                    case AUTH_DEACTIVATED:
                        totpPopupWindow?.[2];
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_TOO_MANY_REQUESTS:
                        totpPopupWindow?.[2];
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case 'APPROVED': {
                        const currentPgid = pgid;
                        let onDemandImport: Awaited<typeof onDemandImportPromise>;
                        try {
                            onDemandImport = await onDemandImportPromise;
                        } catch (e) {
                            if (currentPgid === pgid) {
                                showMessage(moduleImportError(e));
                            }
                            throw e;
                        }
                        if (currentPgid === pgid) {
                            onDemandImport.approvedCallback();
                        }
                        break;
                    }
                    default:
                        showMessage(invalidResponse());
                }
            },
            content: content + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(passwordInput, disabled);
        disableInput(emailInput, disabled);
        disableInput(rememberMeInput, disabled);
    }
}

function getRememberMeCheckbox() {
    const container = createDivElement();
    container.id = 'remember-me';

    const label = createElement('label') as HTMLLabelElement;
    addClass(label, 'checkbox-container');

    appendChild(label, createParagraphElement(keepLoggedInText));

    const input = createInputElement('checkbox');
    input.id = 'remember-me-checkbox';
    appendChild(label, input);

    const checkmark = createDivElement();
    addClass(checkmark, 'checkmark');
    appendChild(label, checkmark);

    appendChild(container, label);
    return [container, input] as const;
}