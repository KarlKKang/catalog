import { changeColor, disableInput } from '../module/common';
import { addClass, appendChild, addEventListener, appendText, createButtonElement, createDivElement, createInputElement, createParagraphElement, hideElement, replaceText, showElement } from '../module/dom';
import { pgid } from '../module/global';
import { failedTotp } from '../module/message/template/inline';
import type { PopupWindow } from '../module/popup_window/core';
import { addInterval, removeInterval } from '../module/timer';

export type EmailOtpPopupWindow = [
    string | undefined, // otp
    () => Promise<EmailOtpPopupWindow>, // show warning or reset resend timer
    () => void, // close
];

const enum RejectReason {
    CLOSE,
}

export function promptForEmailOtp(initializePopupWindow: () => Promise<PopupWindow>) {
    const currentPgid = pgid;

    let returnPromiseResolve: (value: EmailOtpPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<EmailOtpPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    initializePopupWindow().then((popupWindow) => {
        if (currentPgid !== pgid) {
            return;
        }

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
        let currentResendInterval: NodeJS.Timer | null = null;
        const resetResendTimer = () => {
            resendButton.style.cursor = 'not-allowed';
            resendButton.style.width = 'auto';
            resendButton.innerText = resendButtonText + '（60秒）';
            let count = 60;
            const interval = addInterval(() => {
                count--;
                if (count <= 0) {
                    resendButton.disabled = false;
                    resendButton.style.removeProperty('cursor');
                    resendButton.style.removeProperty('width');
                    replaceText(resendButton, resendButtonText);
                    currentResendInterval = null;
                    removeInterval(interval);
                } else {
                    replaceText(resendButton, resendButtonText + '（' + count + '秒）');
                }
            }, 1000);
            if (currentResendInterval !== null) {
                removeInterval(currentResendInterval);
            }
            currentResendInterval = interval;
        };
        resendButton.disabled = true;
        resetResendTimer();
        appendChild(inputFlexbox, resendButton);

        addEventListener(resendButton, 'click', () => {
            resendButton.disabled = true;
            returnPromiseResolve([
                undefined,
                () => {
                    resetResendTimer();
                    return new Promise<EmailOtpPopupWindow>((resolve, reject) => {
                        returnPromiseResolve = resolve;
                        returnPromiseReject = reject;
                    });
                },
                popupWindow.hide
            ]);
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

        const disableAllInputs = (disabled: boolean) => {
            disableInput(otpInput, disabled);
            if (resendButton.textContent === resendButtonText) {
                resendButton.disabled = disabled;
            }
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;
        };
        const submit = () => {
            disableAllInputs(true);
            hideElement(warningText);

            const otp = otpInput.value.toUpperCase();
            if (!/^[2-9A-HJ-NP-Z]{6}$/.test(otp)) {
                showElement(warningText);
                disableAllInputs(false);
                return;
            }

            returnPromiseResolve([
                otp,
                () => {
                    disableAllInputs(false);
                    showElement(warningText);
                    return new Promise<EmailOtpPopupWindow>((resolve, reject) => {
                        returnPromiseResolve = resolve;
                        returnPromiseReject = reject;
                    });
                },
                popupWindow.hide
            ]);
        };
        addEventListener(submitButton, 'click', submit);
        addEventListener(otpInput, 'keydown', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                submit();
            }
        });
        addEventListener(cancelButton, 'click', () => {
            returnPromiseReject(RejectReason.CLOSE);
            currentResendInterval !== null && removeInterval(currentResendInterval);
            popupWindow.hide();
        });

        popupWindow.show(promptText, warningText, inputFlexbox, buttonFlexbox);
        otpInput.focus();
    });

    return returnPromise;
}