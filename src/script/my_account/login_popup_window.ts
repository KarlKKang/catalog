import { addEventListener, addClass, appendChild, appendText, createButtonElement, createDivElement, createParagraphElement, replaceText, createSpanElement, openWindow, createEmailInput, createPasswordInput, disableInput } from '../module/dom';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import { loginFailed } from '../module/text/message/body';
import { TOP_URL } from '../module/env/constant';
import type { initializePopupWindow as InitializePopupWindow } from '../module/popup_window/core';
import { changeColor, hideElement, horizontalCenter, showElement } from '../module/style';
import { cancelButtonText, forgetPasswordText, submitButtonText } from '../module/text/ui';

export type LoginPopupWindow = [
    string, // email
    string, // password
    (message: string) => Promise<LoginPopupWindow>, // show warning
    () => void, // close
];

const enum RejectReason {
    CLOSE,
}

export function promptForLogin(initializePopupWindow: typeof InitializePopupWindow, inputFlexboxClass: string, message?: string) {
    let returnPromiseResolve: (value: LoginPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<LoginPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    const promptText = createParagraphElement('メールアドレスとパスワードを入力してください。');

    const warningText = createParagraphElement();
    changeColor(warningText, 'red');
    if (message !== undefined) {
        appendText(warningText, message);
    } else {
        hideElement(warningText);
    }

    const [emailInputContainer, emailInput] = createEmailInput();
    horizontalCenter(emailInputContainer);

    const [passwordInputContainer, passwordInput] = createPasswordInput(false);
    horizontalCenter(passwordInputContainer);

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, inputFlexboxClass);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const forgetPasswordParagraph = createParagraphElement();
    const forgetPasswordLink = createSpanElement(forgetPasswordText);
    addClass(forgetPasswordLink, 'link');
    appendChild(forgetPasswordParagraph, forgetPasswordLink);
    addEventListener(forgetPasswordLink, 'click', () => {
        openWindow(TOP_URL + '/request_password_reset');
    });

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox, forgetPasswordParagraph],
        () => { emailInput.focus(); },
    );

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
            hidePopupWindow
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
        hidePopupWindow();
    });

    return returnPromise;
}