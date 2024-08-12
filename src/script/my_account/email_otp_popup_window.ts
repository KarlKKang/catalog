import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createTotpInput } from '../module/dom/element/input/totp/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableStyledInput } from '../module/dom/element/input/disable_styled';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { addEventListener } from '../module/event_listener';
import { failedTotp } from '../module/text/message/body';
import { initializePopupWindow, styles } from '../module/popup_window/core';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setCursor, CSS_CURSOR } from '../module/style/cursor';
import { setWidth } from '../module/style/width';
import { CSS_AUTO } from '../module/style/value/auto';
import { addInterval, type Interval, removeInterval } from '../module/timer';
import { cancelButtonText } from '../module/text/button/cancel';
import { submitButtonText } from '../module/text/button/submit';
import { StyledInputElementKey } from '../module/dom/element/input/type';

export const enum EmailOtpPopupWindowKey {
    OTP,
    SHOW_WARNING,
    CLOSE,
}
export interface EmailOtpPopupWindow {
    [EmailOtpPopupWindowKey.OTP]: string | undefined;
    [EmailOtpPopupWindowKey.SHOW_WARNING]: () => Promise<EmailOtpPopupWindow>;
    [EmailOtpPopupWindowKey.CLOSE]: () => void;
}

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

    const otpStyledInput = createTotpInput(false);
    const {
        [StyledInputElementKey.CONTAINER]: otpInputContainer,
        [StyledInputElementKey.INPUT]: otpInput,
    } = otpStyledInput;
    appendChild(inputFlexbox, otpInputContainer);

    const resendButton = createStyledButtonElement();
    const resendButtonText = '再送信する';
    let currentResendInterval: Interval | null = null;
    const resetResendTimer = () => {
        setCursor(resendButton, CSS_CURSOR.NOT_ALLOWED);
        setWidth(resendButton, CSS_AUTO);
        resendButton.innerText = resendButtonText + '（60秒）';
        let count = 60;
        const interval = addInterval(() => {
            count--;
            if (count <= 0) {
                disableButton(resendButton, false);
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
    disableButton(resendButton, true);
    resetResendTimer();
    appendChild(inputFlexbox, resendButton);

    const submitButton = createStyledButtonElement(submitButtonText);
    const cancelButton = createStyledButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, styles.inputFlexbox);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, inputFlexbox, buttonFlexbox],
        () => { otpInput.focus(); },
    );

    addEventListener(resendButton, 'click', () => {
        disableButton(resendButton, true);
        returnPromiseResolve({
            [EmailOtpPopupWindowKey.OTP]: undefined,
            [EmailOtpPopupWindowKey.SHOW_WARNING]: () => {
                resetResendTimer();
                return new Promise<EmailOtpPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            [EmailOtpPopupWindowKey.CLOSE]: hidePopupWindow,
        });
    });

    const disableAllInputs = (disabled: boolean) => {
        disableStyledInput(otpStyledInput, disabled);
        if (resendButton.textContent === resendButtonText) {
            disableButton(resendButton, disabled);
        }
        disableButton(submitButton, disabled);
        disableButton(cancelButton, disabled);
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
            [EmailOtpPopupWindowKey.CLOSE]: hidePopupWindow,
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
