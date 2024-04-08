import { addClass, appendChild, addEventListener, createButtonElement, createDivElement, createParagraphElement, replaceText, createTotpInput, disableInput } from '../module/dom';
import { failedTotp } from '../module/text/message/body';
import { initializePopupWindow, styles, } from '../module/popup_window/core';
import { changeColor, hideElement, setCursor, setWidth, showElement } from '../module/style';
import { CSS_AUTO, CSS_COLOR, CSS_CURSOR } from '../module/style/value';
import { addInterval, removeInterval } from '../module/timer';
import { cancelButtonText, submitButtonText } from '../module/text/ui';

export const enum EmailOtpPopupWindowKey {
    OTP,
    SHOW_WARNING,
    CLOSE,
}
export type EmailOtpPopupWindow = {
    [EmailOtpPopupWindowKey.OTP]: string | undefined;
    [EmailOtpPopupWindowKey.SHOW_WARNING]: () => Promise<EmailOtpPopupWindow>;
    [EmailOtpPopupWindowKey.CLOSE]: () => void;
};

const enum RejectReason {
    CLOSE,
}

export function promptForEmailOtp() {
    let returnPromiseResolve: (value: EmailOtpPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<EmailOtpPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    const promptText = createParagraphElement('メールに送信された認証コードを入力してください。');

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, CSS_COLOR.RED);
    hideElement(warningText);

    const inputFlexbox = createDivElement();
    addClass(inputFlexbox, styles.inputFlexbox);

    const [otpInputContainer, otpInput] = createTotpInput(false);
    appendChild(inputFlexbox, otpInputContainer);

    const resendButton = createButtonElement();
    const resendButtonText = '再送信する';
    let currentResendInterval: ReturnType<typeof setInterval> | null = null;
    const resetResendTimer = () => {
        setCursor(resendButton, CSS_CURSOR.NOT_ALLOWED);
        setWidth(resendButton, CSS_AUTO);
        resendButton.innerText = resendButtonText + '（60秒）';
        let count = 60;
        const interval = addInterval(() => {
            count--;
            if (count <= 0) {
                resendButton.disabled = false;
                setCursor(resendButton, null);
                setWidth(resendButton, null);
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

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, styles.inputFlexbox);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, inputFlexbox, buttonFlexbox],
        () => { otpInput.focus(); },
    );

    addEventListener(resendButton, 'click', () => {
        resendButton.disabled = true;
        returnPromiseResolve({
            [EmailOtpPopupWindowKey.OTP]: undefined,
            [EmailOtpPopupWindowKey.SHOW_WARNING]: () => {
                resetResendTimer();
                return new Promise<EmailOtpPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            [EmailOtpPopupWindowKey.CLOSE]: hidePopupWindow
        });
    });

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

        returnPromiseResolve({
            [EmailOtpPopupWindowKey.OTP]: otp,
            [EmailOtpPopupWindowKey.SHOW_WARNING]: () => {
                disableAllInputs(false);
                showElement(warningText);
                return new Promise<EmailOtpPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            [EmailOtpPopupWindowKey.CLOSE]: hidePopupWindow
        });
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
        hidePopupWindow();
    });

    return returnPromise;
}