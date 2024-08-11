import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInput } from '../module/dom/element/input/password/create';
import { createEmailInput } from '../module/dom/element/input/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInput } from '../module/dom/change_input';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { openWindow } from '../module/dom/document';
import { addEventListener } from '../module/event_listener';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/regex';
import { loginFailed } from '../module/text/message/body';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { cancelButtonText, forgetPasswordText, submitButtonText } from '../module/text/ui';
import * as commonStyles from '../../css/common.module.scss';
import { initializePopupWindow, styles } from '../module/popup_window/core';
import { REQUEST_PASSWORD_RESET_URI } from '../module/env/uri';

export const enum LoginPopupWindowKey {
    EMAIL,
    PASSWORD,
    SHOW_WARNING,
    CLOSE,
}
export interface LoginPopupWindow {
    [LoginPopupWindowKey.EMAIL]: string;
    [LoginPopupWindowKey.PASSWORD]: string;
    [LoginPopupWindowKey.SHOW_WARNING]: (message: string) => Promise<LoginPopupWindow>;
    [LoginPopupWindowKey.CLOSE]: () => void;
}

const enum RejectReason {
    CLOSE,
}

export function promptForLogin(message?: string) {
    let returnPromiseResolve: (value: LoginPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<LoginPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    const promptText = createParagraphElement('メールアドレスとパスワードを入力してください。');

    const warningText = createParagraphElement();
    changeColor(warningText, CSS_COLOR.RED);
    if (message !== undefined) {
        appendText(warningText, message);
    } else {
        hideElement(warningText);
    }

    const [emailInputContainer, emailInput] = createEmailInput();
    horizontalCenter(emailInputContainer);

    const [passwordInputContainer, passwordInput] = createPasswordInput(false);
    horizontalCenter(passwordInputContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
    const cancelButton = createStyledButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, styles.inputFlexbox);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const forgetPasswordParagraph = createParagraphElement();
    const forgetPasswordLink = createSpanElement(forgetPasswordText);
    addClass(forgetPasswordLink, commonStyles.link);
    appendChild(forgetPasswordParagraph, forgetPasswordLink);
    addEventListener(forgetPasswordLink, 'click', () => {
        openWindow(REQUEST_PASSWORD_RESET_URI);
    });

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox, forgetPasswordParagraph],
        () => { emailInput.focus(); },
    );

    const disableAllInputs = (disabled: boolean) => {
        disableInput(emailInput, disabled);
        disableInput(passwordInput, disabled);
        disableButton(submitButton, disabled);
        disableButton(cancelButton, disabled);
    };
    const submit = () => {
        disableAllInputs(true);
        hideElement(warningText);

        const email = emailInput.value;
        const password = passwordInput.value;
        if (!EMAIL_REGEX.test(email) || !PASSWORD_REGEX.test(password)) {
            replaceText(warningText, loginFailed);
            showElement(warningText);
            disableAllInputs(false);
            return;
        }

        returnPromiseResolve({
            [LoginPopupWindowKey.EMAIL]: email,
            [LoginPopupWindowKey.PASSWORD]: password,
            [LoginPopupWindowKey.SHOW_WARNING]: (message: string) => {
                disableAllInputs(false);
                replaceText(warningText, message);
                showElement(warningText);
                return new Promise<LoginPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            [LoginPopupWindowKey.CLOSE]: hidePopupWindow,
        });
    };
    const submitOnKeyDown = (event: Event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submit();
        }
    };
    addEventListener(submitButton, 'click', submit);
    addEventListener(emailInput, 'keydown', submitOnKeyDown);
    addEventListener(passwordInput, 'keydown', submitOnKeyDown);
    addEventListener(cancelButton, 'click', () => {
        returnPromiseReject(RejectReason.CLOSE);
        hidePopupWindow();
    });

    return returnPromise;
}
