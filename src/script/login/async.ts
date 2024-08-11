import {
    sendServerRequest,
    ServerRequestOptionKey,
} from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInput } from '../module/dom/element/input/password/create';
import { createEmailInput } from '../module/dom/element/input/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createInputElement } from '../module/dom/element/input/native/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { getParentElement } from '../module/dom/get_element';
import { disableStyledInput } from '../module/dom/element/input/disable_styled';
import { disableButton } from '../module/dom/element/button/disable';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from '../module/text/message/body';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/auth_results';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/regex';
import { buildURLForm, joinURLForms } from '../module/http_form';
import { pgid, redirect } from '../module/global';
import { handleFailedTotp, TotpPopupWindowKey, type TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { forgetPasswordText } from '../module/text/ui';
import * as commonStyles from '../../css/common.module.scss';
import * as formStyles from '../../css/portal_form.module.scss';
import * as styles from '../../css/login.module.scss';
import { REQUEST_PASSWORD_RESET_URI } from '../module/env/uri';
import { createLabelElement } from '../module/dom/element/label/create';
import { StyledInputElementKey } from '../module/dom/element/input/type';

export default function (
    approvedCallbackPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './approved_callback'
    )>,
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

    const emailStyledInput = createEmailInput();
    const {
        [StyledInputElementKey.CONTAINER]: emailContainer,
        [StyledInputElementKey.INPUT]: emailInput,
    } = emailStyledInput;
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const passwordStyledInput = createPasswordInput(false);
    const {
        [StyledInputElementKey.CONTAINER]: passwordContainer,
        [StyledInputElementKey.INPUT]: passwordInput,
    } = passwordStyledInput;
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const [rememberMeContainer, rememberMeInput] = getRememberMeCheckbox();
    appendChild(container, rememberMeContainer);

    const submitButton = createStyledButtonElement('ログイン');
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
        redirect(REQUEST_PASSWORD_RESET_URI, true);
    });

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

        sendLoginRequest(
            buildURLForm({
                email: email,
                password: password,
                remember_me: rememberMeInput.checked ? 1 : 0,
            }),
        );
    }

    function sendLoginRequest(content: string, totpPopupWindow?: TotpPopupWindow) {
        sendServerRequest('login', {
            [ServerRequestOptionKey.CALLBACK]: async function (response: string) {
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
                            },
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
                        const approvedCallback = await approvedCallbackPromise;
                        if (currentPgid === pgid) {
                            approvedCallback.default();
                        }
                        break;
                    }
                    default:
                        showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionKey.CONTENT]: joinURLForms(
                content,
                buildURLForm({
                    totp: totpPopupWindow?.[TotpPopupWindowKey.TOTP],
                }),
            ),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableStyledInput(passwordStyledInput, disabled);
        disableStyledInput(emailStyledInput, disabled);
        disableCheckbox(rememberMeInput, disabled);
    }
}

function getRememberMeCheckbox() {
    const container = createDivElement();
    addClass(container, styles.rememberMe);

    const label = createLabelElement();
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
