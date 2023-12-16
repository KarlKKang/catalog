import { addEventListener, addClass, appendChild, appendText, createButtonElement, createDivElement, createParagraphElement, createInputElement, hideElement, showElement, replaceText } from '../module/dom';
import { changeColor, disableInput, passwordStyling } from '../module/common';
import type { PopupWindow } from '../module/popup_window/core';
import { pgid } from '../module/global';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import { loginFailed } from '../module/message/template/inline';

export type LoginPopupWindow = [
    string, // email
    string, // password
    (message: string) => Promise<LoginPopupWindow>, // show warning
    () => void, // close
];

const enum RejectReason {
    CLOSE,
}

export function promptForLogin(initializePopupWindow: () => Promise<PopupWindow>, message?: string) {
    const currentPgid = pgid;

    let returnPromiseResolve: (value: LoginPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<LoginPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    initializePopupWindow().then((popupWindow) => {
        if (currentPgid !== pgid) {
            return;
        }

        const promptText = createParagraphElement();
        appendText(promptText, 'メールアドレスとパスワードを入力してください。');

        const warningText = createParagraphElement();
        changeColor(warningText, 'red');
        if (message !== undefined) {
            appendText(warningText, message);
        } else {
            hideElement(warningText);
        }

        const emailInputContainer = createDivElement();
        addClass(emailInputContainer, 'input-field');
        addClass(emailInputContainer, 'hcenter');
        const emailInput = createInputElement();
        emailInput.type = 'email';
        emailInput.autocomplete = 'email';
        emailInput.placeholder = 'メールアドレス';
        emailInput.autocapitalize = 'off';
        emailInput.maxLength = 254;
        appendChild(emailInputContainer, emailInput);

        const passwordInputContainer = createDivElement();
        addClass(passwordInputContainer, 'input-field');
        addClass(passwordInputContainer, 'hcenter');
        const passwordInput = createInputElement();
        passwordInput.type = 'password';
        passwordInput.autocomplete = 'current-password';
        passwordInput.placeholder = 'パスワード';
        passwordStyling(passwordInput);
        appendChild(passwordInputContainer, passwordInput);

        const submitButton = createButtonElement();
        addClass(submitButton, 'button');
        appendText(submitButton, '送信する');
        const cancelButton = createButtonElement();
        addClass(cancelButton, 'button');
        appendText(cancelButton, 'キャンセル');
        const buttonFlexbox = createDivElement();
        addClass(buttonFlexbox, 'input-flexbox');
        appendChild(buttonFlexbox, submitButton);
        appendChild(buttonFlexbox, cancelButton);

        const disableAllInputs = (disabled: boolean) => {
            disableInput(emailInput, disabled);
            disableInput(passwordInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

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

            returnPromiseResolve([
                email,
                password,
                (message: string) => {
                    disableAllInputs(false);
                    replaceText(warningText, message);
                    showElement(warningText);
                    return new Promise<LoginPopupWindow>((resolve, reject) => {
                        returnPromiseResolve = resolve;
                        returnPromiseReject = reject;
                    });
                },
                popupWindow.hide
            ]);
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
            popupWindow.hide();
        });

        popupWindow.show(promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox);
        emailInput.focus();
    });

    return returnPromise;
}