import {
    sendServerRequest,
    ServerRequestOptionKey,
} from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInputField } from '../module/dom/element/input/input_field/password/create';
import { createEmailInputField } from '../module/dom/element/input/input_field/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createInputElement } from '../module/dom/element/input/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { sessionEnded } from '../module/text/misc/session_ended';
import { accountDeactivated } from '../module/text/auth/deactivated';
import { tooManyFailedLogin } from '../module/text/auth/too_many_failed';
import { loginFailed } from '../module/text/auth/failed';
import { AUTH_TOO_MANY_REQUESTS } from '../module/auth_result/too_many_requests';
import { AUTH_DEACTIVATED } from '../module/auth_result/deactivated';
import { AUTH_FAILED_TOTP } from '../module/auth_result/failed_totp';
import { AUTH_FAILED } from '../module/auth_result/failed';
import { testPassword } from '../module/regex/password';
import { testEmail } from '../module/regex/email';
import { joinHttpForms } from '../module/string/http_form/join';
import { buildHttpForm } from '../module/string/http_form/build';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { handleFailedTotp, TotpPopupWindowKey, type TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/message/param/invalid_response';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { forgetPasswordText } from '../module/text/password/forget';
import { link as linkClass } from '../../css/link.module.scss';
import * as formStyles from '../../css/portal_form.module.scss';
import * as styles from '../../css/login.module.scss';
import { REQUEST_PASSWORD_RESET_URI } from '../module/env/uri';
import { createLabelElement } from '../module/dom/element/label/create';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';

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

    const emailInputField = createEmailInputField();
    const {
        [InputFieldElementKey.CONTAINER]: emailContainer,
        [InputFieldElementKey.INPUT]: emailInput,
    } = emailInputField;
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const passwordInputField = createPasswordInputField(false);
    const {
        [InputFieldElementKey.CONTAINER]: passwordContainer,
        [InputFieldElementKey.INPUT]: passwordInput,
    } = passwordInputField;
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const [rememberMeContainer, rememberMeLabel, rememberMeInput] = getRememberMeCheckbox();
    appendChild(container, rememberMeContainer);

    const submitButton = createStyledButtonElement('ログイン');
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const forgetPassword = createParagraphElement();
    const forgetPasswordLink = createSpanElement(forgetPasswordText);
    addClass(forgetPasswordLink, linkClass);
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
        redirectSameOrigin(REQUEST_PASSWORD_RESET_URI);
    });

    function login() {
        disableAllInputs(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!testEmail(email) || !testPassword(password)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendLoginRequest(
            buildHttpForm({
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
            [ServerRequestOptionKey.CONTENT]: joinHttpForms(
                content,
                buildHttpForm({
                    totp: totpPopupWindow?.[TotpPopupWindowKey.TOTP],
                }),
            ),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInputField(passwordInputField, disabled);
        disableInputField(emailInputField, disabled);
        disableCheckbox(rememberMeLabel, rememberMeInput, disabled);
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
    return [container, label, input] as const;
}

function disableCheckbox(parent: HTMLLabelElement, checkbox: HTMLInputElement, disabled: boolean) {
    checkbox.disabled = disabled;
    if (disabled) {
        addClass(parent, styles.disabled);
    } else {
        removeClass(parent, styles.disabled);
    }
}
