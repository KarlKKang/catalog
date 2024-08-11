import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInput } from '../module/dom/element/input/password/create';
import { createEmailInput } from '../module/dom/element/input/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableStyledInput } from '../module/dom/element/input/disable_styled';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild, replaceChildren } from '../module/dom/change_node';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from '../module/text/message/body';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/auth_results';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/regex';
import { buildURLForm, joinURLForms } from '../module/http_form';
import { TotpPopupWindowKey, handleFailedTotp, type TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { submitButtonText } from '../module/text/ui';
import { emailChangePageTitle } from '../module/text/page_title';
import * as styles from '../../css/portal_form.module.scss';
import { completed } from '../module/text/message/title';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { TOP_URI } from '../module/env/uri';
import { StyledInputElementKey } from '../module/dom/element/input/type';

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

        sendChangeEmailRequest(
            buildURLForm({ p: param, email: email, password: password }),
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
                            [MessageParamKey.TITLE]: completed,
                            [MessageParamKey.MESSAGE]: 'メールアドレスが変更されました。',
                            [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                            [MessageParamKey.URL]: TOP_URI,
                            [MessageParamKey.BUTTON_TEXT]: 'トップページへ',
                        });
                        break;
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
        disableStyledInput(emailStyledInput, disabled);
        disableStyledInput(passwordStyledInput, disabled);
    }
}
