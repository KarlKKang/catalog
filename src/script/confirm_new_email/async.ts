import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInputField } from '../module/dom/element/input/input_field/password/create';
import { createEmailInputField } from '../module/dom/element/input/input_field/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param/expired';
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
import { TotpPopupWindowKey, handleFailedTotp, type TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/message/param/invalid_response';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { submitButtonText } from '../module/text/button/submit';
import { emailChangePageTitle } from '../module/text/page_title';
import * as styles from '../../css/portal_form.module.scss';
import { completedTitle } from '../module/text/misc/completed_title';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { TOP_URI } from '../module/env/uri';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';

export default function (param: string) {
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

    const submitButton = createStyledButtonElement(submitButtonText);
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

        if (!testEmail(email)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        if (!testPassword(password)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendChangeEmailRequest(
            buildHttpForm({ p: param, email: email, password: password }),
        );
    }

    function sendChangeEmailRequest(content: string, totpPopupWindow?: TotpPopupWindow) {
        sendServerRequest('change_email', {
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
                                sendChangeEmailRequest(content, totpPopupWindow);
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
                    case 'EXPIRED':
                        showMessage(expired);
                        break;
                    case 'DONE':
                        showMessage({
                            [MessageParamKey.TITLE]: completedTitle,
                            [MessageParamKey.MESSAGE]: 'メールアドレスが変更されました。',
                            [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                            [MessageParamKey.URL]: TOP_URI,
                            [MessageParamKey.BUTTON]: 'トップページへ',
                        });
                        break;
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
        disableInputField(emailInputField, disabled);
        disableInputField(passwordInputField, disabled);
    }
}
