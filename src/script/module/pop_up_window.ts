import { addEventListener, addClass, appendChild, appendText, createButtonElement, createDivElement, createParagraphElement, getBody, removeClass, replaceChildren, w, createInputElement, hideElement, showElement, replaceText, appendChildren } from './dom';
import { EMAIL_REGEX, PASSWORD_REGEX, changeColor, disableInput, isString, passwordStyling } from './main';
import { failedTotp } from './message/template/inline';

type PopUpWindow = {
    show: (...contents: Node[]) => void;
    hide: () => void;
};

let instance: Promise<PopUpWindow> | null = null;

export function initializePopUpWindow() {
    if (instance !== null) {
        return instance;
    }

    const container = createDivElement();
    container.id = 'pop-up-window';
    const popUpWindow = createDivElement();
    const popUpWindowcontent = createDivElement();
    appendChild(container, popUpWindow);
    appendChild(popUpWindow, popUpWindowcontent);

    let currentTimeout: NodeJS.Timeout | null = null;

    instance = new Promise<PopUpWindow>((resolve) => {
        w.requestAnimationFrame(function () {
            addClass(container, 'invisible');
            addClass(container, 'transparent');
            appendChild(getBody(), container);
            w.requestAnimationFrame(function () {
                resolve({
                    show: function (...contents: Node[]) {
                        currentTimeout = null;
                        replaceChildren(popUpWindowcontent, ...contents);
                        removeClass(container, 'invisible');
                        removeClass(container, 'transparent');
                    },
                    hide: function () {
                        addClass(container, 'transparent');
                        const timeout = setTimeout(function () {
                            if (currentTimeout === timeout) {
                                addClass(container, 'invisible');
                                replaceChildren(popUpWindowcontent);
                            }
                        }, 300);
                        currentTimeout = timeout;
                    }
                });
            });
        });
    });

    return instance;
}

export function promptForTotp(
    submitCallback: (
        totp: string,
        closeWindow: () => void,
        showWarning: () => void,
    ) => void,
    closeWindowCallback: () => void
) {
    initializePopUpWindow().then(function (popUpWindow) {
        const promptText = createParagraphElement();
        appendText(promptText, '二要素認証コードまたはリカバリーコードを入力してください。');

        const warningText = createParagraphElement();
        appendText(warningText, failedTotp);
        changeColor(warningText, 'red');
        hideElement(warningText);

        const totpInputContainer = createDivElement();
        addClass(totpInputContainer, 'input-field');
        addClass(totpInputContainer, 'hcenter');
        const totpInput = createInputElement();
        totpInput.type = 'text';
        totpInput.autocomplete = 'one-time-code';
        totpInput.placeholder = '認証コード';
        totpInput.maxLength = 32;
        appendChild(totpInputContainer, totpInput);

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

        const disableAllInputs = function (disabled: boolean) {
            disableInput(totpInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        addEventListener(submitButton, 'click', function () {
            disableAllInputs(true);
            hideElement(warningText);

            const totp = totpInput.value;
            if (!/^\d{6}$/.test(totp) && !/^[A-Za-z\d/+=]{32}$/.test(totp)) {
                showElement(warningText);
                return;
            }

            submitCallback(
                totp,
                popUpWindow.hide,
                function () {
                    disableAllInputs(false);
                    showElement(warningText);
                }
            );
        });
        addEventListener(cancelButton, 'click', function () {
            closeWindowCallback();
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, totpInputContainer, buttonFlexbox);
    });
}

export function promptForEmailOtp(
    submitCallback: (
        otp: string,
        closeWindow: () => void,
        showWarning: () => void,
    ) => void,
    closeWindowCallback: () => void,
    resetResendTimerCallback: (
        resetResendTimer: () => void,
        closeWindow: () => void,
    ) => void
) {
    initializePopUpWindow().then(function (popUpWindow) {
        const promptText = createParagraphElement();
        appendText(promptText, 'メールに送信された認証コードを入力してください。');

        const warningText = createParagraphElement();
        appendText(warningText, failedTotp);
        changeColor(warningText, 'red');
        hideElement(warningText);

        const inputFlexbox = createDivElement();
        addClass(inputFlexbox, 'input-flexbox');

        const otpInputContainer = createDivElement();
        addClass(otpInputContainer, 'input-field');
        const otpInput = createInputElement();
        otpInput.type = 'text';
        otpInput.autocomplete = 'one-time-code';
        otpInput.placeholder = '認証コード';
        otpInput.maxLength = 6;
        appendChild(otpInputContainer, otpInput);
        appendChild(inputFlexbox, otpInputContainer);

        const resendButton = createButtonElement();
        addClass(resendButton, 'button');
        const resendButtonText = '再送信する';
        const resetResendTimer = function () {
            resendButton.disabled = true;
            resendButton.style.cursor = 'not-allowed';
            resendButton.style.width = 'auto';
            resendButton.innerText = resendButtonText + '（60秒）';
            let count = 60;
            const interval = setInterval(function () {
                count--;
                if (count <= 0) {
                    resendButton.disabled = false;
                    resendButton.style.removeProperty('cursor');
                    resendButton.style.removeProperty('width');
                    replaceText(resendButton, resendButtonText);
                    clearInterval(interval);
                } else {
                    replaceText(resendButton, resendButtonText + '（' + count + '秒）');
                }
            }, 1000);
        };
        resetResendTimer();
        appendChild(inputFlexbox, resendButton);

        addEventListener(resendButton, 'click', function () {
            resetResendTimerCallback(
                resetResendTimer,
                popUpWindow.hide
            );
        });

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

        const disableAllInputs = function (disabled: boolean) {
            disableInput(otpInput, disabled);
            if (resendButton.textContent === resendButtonText) {
                resendButton.disabled = disabled;
            }
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        addEventListener(submitButton, 'click', function () {
            disableAllInputs(true);
            hideElement(warningText);

            const otp = otpInput.value;
            if (!/^[2-9A-HJ-NP-Z]{6}$/.test(otp)) {
                showElement(warningText);
                return;
            }

            submitCallback(
                otp,
                popUpWindow.hide,
                function () {
                    disableAllInputs(false);
                    showElement(warningText);
                }
            );
        });
        addEventListener(cancelButton, 'click', function () {
            closeWindowCallback();
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, inputFlexbox, buttonFlexbox);
    });
}

export function promptForLogin(
    submitCallback: (
        email: string,
        password: string,
        closeWindow: () => void,
        showWarning: (message: string | Node[]) => void,
    ) => void,
    closeWindowCallback: () => void,
    message?: string | Node[]
) {
    initializePopUpWindow().then(function (popUpWindow) {
        const promptText = createParagraphElement();
        appendText(promptText, 'メールアドレスとパスワードを入力してください。');

        const warningText = createParagraphElement();
        if (message !== undefined) {
            if (isString(message)) {
                appendText(warningText, message as string);
            } else {
                appendChildren(warningText, ...message as Node[]);
            }
        } else {
            hideElement(warningText);
        }
        changeColor(warningText, 'red');

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

        const disableAllInputs = function (disabled: boolean) {
            disableInput(emailInput, disabled);
            disableInput(passwordInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        addEventListener(submitButton, 'click', function () {
            disableAllInputs(true);
            hideElement(warningText);

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!EMAIL_REGEX.test(email)) {
                showElement(warningText);
                return;
            }

            if (!PASSWORD_REGEX.test(password)) {
                showElement(warningText);
                return;
            }

            submitCallback(
                email,
                password,
                popUpWindow.hide,
                function (message: string | Node[]) {
                    disableAllInputs(false);
                    if (isString(message)) {
                        replaceText(warningText, message as string);
                    } else {
                        replaceChildren(warningText, ...message as Node[]);
                    }
                    showElement(warningText);
                }
            );
        });
        addEventListener(cancelButton, 'click', function () {
            closeWindowCallback();
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox);
    });
}