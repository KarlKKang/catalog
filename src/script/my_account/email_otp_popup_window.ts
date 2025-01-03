import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createTotpInputField } from '../module/dom/element/input/input_field/totp/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { addEventListener } from '../module/event_listener/add';
import { failedTotp } from '../module/text/auth/failed_totp';
import { initializePopupWindow, styles } from '../module/popup_window/core';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setCursor, CSS_CURSOR } from '../module/style/cursor';
import { setWidth } from '../module/style/width';
import { CSS_AUTO } from '../module/style/value/auto';
import { type Interval } from '../module/timer/type';
import { removeInterval } from '../module/timer/remove/interval';
import { addInterval } from '../module/timer/add/interval';
import { cancelButtonText } from '../module/text/button/cancel';
import { submitButtonText } from '../module/text/button/submit';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';

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

    const otpInputField = createTotpInputField(false);
    const {
        [InputFieldElementKey.CONTAINER]: otpInputContainer,
        [InputFieldElementKey.INPUT]: otpInput,
    } = otpInputField;
    appendChild(inputFlexbox, otpInputContainer);

    const resendButton = createStyledButtonElement();
    const resendButtonText = '再送信する';
    let currentResendInterval: Interval | null = null;
    let allButtonDisabled = false;
    const resetResendTimer = () => {
        setCursor(resendButton, CSS_CURSOR.NOT_ALLOWED);
        setWidth(resendButton, CSS_AUTO);
        resendButton.innerText = resendButtonText + '（60秒）';
        let count = 60;
        const interval = addInterval(() => {
            count--;
            if (count <= 0) {
                if (!allButtonDisabled) {
                    disableButton(resendButton, false);
                }
                setCursor(resendButton, null);
                setWidth(resendButton, null);
                replaceText(resendButton, resendButtonText);
                currentResendInterval = null;
                removeInterval(interval);
            } else {
                replaceText(resendButton, resendButtonText + '（' + count + '秒）');
            }
        }, 1000);
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
        allButtonDisabled = disabled;
        disableInputField(otpInputField, disabled);
        if (currentResendInterval === null) {
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
        hidePopupWindow();
    });

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, inputFlexbox, buttonFlexbox],
        () => {
            removeAllEventListeners(submitButton);
            removeAllEventListeners(cancelButton);
            removeAllEventListeners(otpInput);
            removeAllEventListeners(resendButton);
            currentResendInterval !== null && removeInterval(currentResendInterval);
        },
        () => { otpInput.focus(); },
    );

    return returnPromise;
}
