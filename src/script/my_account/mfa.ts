
import {
    sendServerRequest,
    changeColor,
    disableInput,
} from '../module/common';
import {
    addEventListener,
    showElement,
    hideElement,
    appendText,
    replaceText,
    createCanvasElement,
    createParagraphElement,
    createDivElement,
    addClass,
    createInputElement,
    appendChild,
    createButtonElement,
    createAnchorElement,
    removeClass,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import {
    failedTotp,
    generateRecoveryCodeWait,
    mfaNotSet,
    mfaAlreadySet,
    sessionEnded,
    mfaDisabled,
    mfaEnabled,
    loginNotificationEnabled,
    loginNotificationDisabled,
} from '../module/message/template/inline';
import * as TOTPInfo from '../module/type/TOTPInfo';
import * as RecoveryCodeInfo from '../module/type/RecoveryCodeInfo';
import { toCanvas } from 'qrcode';
import { addInterval, removeInterval } from '../module/timer';
import { pgid } from '../module/global';
import { SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS, SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, SHARED_VAR_IDX_MFA_WARNING, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_RECOVERY_CODE_WARNING, getSharedBool, getSharedElement, setCurrentLoginNotificationStatus, setCurrentMfaStatus } from './shared_var';
import { changeMfaStatus, disableAllInputs, promptForLogin, reauthenticationPrompt, serverResponseCallback } from './helper';
import { popupWindowImportPromise } from './import_promise';

export function enableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SHARED_VAR_IDX_MFA_WARNING);

    hideElement(mfaWarning);
    changeColor(mfaWarning, 'red');

    modifyMfaReauthenticationPrompt(
        (
            content: string,
            closeWindow: () => void,
            failedCallback: (message: string | Node[]) => void,
            otpSentCallback?: () => void,
            failedOtpCallback?: () => void,
        ) => {
            sendServerRequest('generate_totp', {
                callback: (response: string) => {
                    serverResponseCallback(response, failedCallback, () => {
                        closeWindow();
                        changeColor(mfaWarning, 'green');
                        replaceText(mfaWarning, mfaAlreadySet);
                        showElement(mfaWarning);
                        setCurrentMfaStatus(true);
                        changeMfaStatus();
                        disableAllInputs(false);
                    }, () => {
                        if (response == 'FAILED EMAIL OTP') {
                            failedOtpCallback?.();
                        } else if (response == 'SENT') {
                            otpSentCallback?.();
                        } else {
                            let parsedResponse: TOTPInfo.TOTPInfo;
                            try {
                                parsedResponse = JSON.parse(response);
                                TOTPInfo.check(parsedResponse);
                            } catch (e) {
                                showMessage(invalidResponse());
                                return;
                            }
                            promptForTotpSetup(parsedResponse);
                        }
                    });
                },
                content: content,
                showSessionEndedMessage: true,
            });
        }
    );
}

export function disableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SHARED_VAR_IDX_MFA_WARNING);

    hideElement(mfaWarning);
    changeColor(mfaWarning, 'red');

    modifyMfaReauthenticationPrompt(
        (
            content: string,
            closeWindow: () => void,
            failedCallback: (message: string | Node[]) => void,
            otpSentCallback?: () => void,
            failedOtpCallback?: () => void,
        ) => {
            sendServerRequest('disable_totp', {
                callback: (response: string) => {
                    serverResponseCallback(response, failedCallback, () => { /* This page will never respond with `FAILED TOTP` */ }, () => {
                        if (response == 'FAILED EMAIL OTP') {
                            failedOtpCallback?.();
                        } else if (response == 'SENT') {
                            otpSentCallback?.();
                        } else if (response == 'DONE') {
                            closeWindow();
                            changeColor(mfaWarning, 'green');
                            replaceText(mfaWarning, mfaDisabled);
                            showElement(mfaWarning);
                            setCurrentMfaStatus(false);
                            setCurrentLoginNotificationStatus(true);
                            changeMfaStatus();
                            disableAllInputs(false);
                        } else {
                            showMessage();
                        }
                    });
                },
                content: content,
                showSessionEndedMessage: true,
            });
        }
    );
}

export function generateRecoveryCode() {
    disableAllInputs(true);
    const recoveryCodeWarning = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_WARNING);

    hideElement(recoveryCodeWarning);
    changeColor(recoveryCodeWarning, 'red');

    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            failedCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('generate_recovery_code', {
                callback: (response: string) => {
                    serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                        if (response == 'TOTP NOT SET') {
                            closeWindow();
                            replaceText(recoveryCodeWarning, mfaNotSet);
                            showElement(recoveryCodeWarning);
                            disableAllInputs(false);
                        } else if (response == 'WAIT') {
                            closeWindow();
                            replaceText(recoveryCodeWarning, generateRecoveryCodeWait);
                            showElement(recoveryCodeWarning);
                            disableAllInputs(false);
                        } else {
                            let parsedResponse: RecoveryCodeInfo.RecoveryCodeInfo;
                            try {
                                parsedResponse = JSON.parse(response);
                                RecoveryCodeInfo.check(parsedResponse);
                            } catch (e) {
                                showMessage(invalidResponse());
                                return;
                            }
                            showRecoveryCode(parsedResponse, () => {
                                hideElement(getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO));
                                disableAllInputs(false);
                            });
                        }
                    });
                },
                content: authenticationParam,
                showSessionEndedMessage: true,
            });
        },
        recoveryCodeWarning,
        true
    );
}

export function changeLoginNotification() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    const loginNotificationTargetStatus = !getSharedBool(SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS);

    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            failedCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('change_login_notification', {
                callback: (response: string) => {
                    serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                        if (response == 'DONE') {
                            setCurrentLoginNotificationStatus(loginNotificationTargetStatus);
                            replaceText(warningElem, loginNotificationTargetStatus ? loginNotificationEnabled : loginNotificationDisabled);
                            changeColor(warningElem, 'green');
                        } else if (response == 'TOTP NOT SET') {
                            setCurrentLoginNotificationStatus(true);
                            setCurrentMfaStatus(false);
                            replaceText(warningElem, mfaNotSet);
                        } else {
                            showMessage(invalidResponse());
                            return;
                        }
                        showElement(warningElem);
                        changeMfaStatus();
                        disableAllInputs(false);
                        closeWindow();
                    });
                },
                content: authenticationParam + '&p=' + (loginNotificationTargetStatus ? '1' : '0'),
                showSessionEndedMessage: true,
            });
        },
        warningElem
    );
}

function modifyMfaReauthenticationPrompt(
    sendRequestCallback: (
        content: string,
        closeWindow: () => void,
        failedCallback: (message: string | Node[]) => void,
        otpSentCallback?: () => void,
        failedOtpCallback?: () => void,
    ) => void,
    message?: string | Node[]
) {
    promptForLogin(
        (email, password, closeWindow, showWarning) => {
            const emailEncoded = encodeURIComponent(email);
            const passwordEncoded = encodeURIComponent(password);

            sendRequestCallback(
                'email=' + emailEncoded + '&password=' + passwordEncoded,
                closeWindow,
                showWarning,
                () => {
                    promptForEmailOtp(
                        (otp, closeWindow, showWarning) => {
                            sendRequestCallback(
                                'email=' + emailEncoded + '&password=' + passwordEncoded + '&otp=' + otp,
                                closeWindow,
                                (message?: string | Node[]) => { modifyMfaReauthenticationPrompt(sendRequestCallback, message); },
                                undefined,
                                showWarning
                            );
                        },
                        (resetResentTimer, closeWindow) => {
                            sendRequestCallback(
                                'email=' + emailEncoded + '&password=' + passwordEncoded,
                                closeWindow,
                                (message: string | Node[]) => { modifyMfaReauthenticationPrompt(sendRequestCallback, message); },
                                resetResentTimer,
                            );
                        }
                    );
                },
            );
        },
        message,
    );
}

async function promptForEmailOtp(
    submitCallback: (
        otp: string,
        closeWindow: () => void,
        showWarning: () => void,
    ) => void,
    resetResendTimerCallback: (
        resetResendTimer: () => void,
        closeWindow: () => void,
    ) => void
) {
    const currentPgid = pgid;
    const popupWindowInitialize = await popupWindowImportPromise;
    if (currentPgid !== pgid) {
        return;
    }

    popupWindowInitialize().then((popupWindow) => {
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
        const resetResendTimer = () => {
            resendButton.disabled = true;
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
                    removeInterval(interval);
                } else {
                    replaceText(resendButton, resendButtonText + '（' + count + '秒）');
                }
            }, 1000);
        };
        resetResendTimer();
        appendChild(inputFlexbox, resendButton);

        addEventListener(resendButton, 'click', () => {
            resetResendTimerCallback(
                resetResendTimer,
                popupWindow.hide
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

        const disableAllPopUpWindowInputs = (disabled: boolean) => {
            disableInput(otpInput, disabled);
            if (resendButton.textContent === resendButtonText) {
                resendButton.disabled = disabled;
            }
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;
        };
        const submit = () => {
            disableAllPopUpWindowInputs(true);
            hideElement(warningText);

            const otp = otpInput.value.toUpperCase();
            if (!/^[2-9A-HJ-NP-Z]{6}$/.test(otp)) {
                showElement(warningText);
                disableAllPopUpWindowInputs(false);
                return;
            }

            submitCallback(
                otp,
                popupWindow.hide,
                () => {
                    showElement(warningText);
                    disableAllPopUpWindowInputs(false);
                }
            );
        };
        addEventListener(submitButton, 'click', submit);
        addEventListener(otpInput, 'keydown', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                submit();
            }
        });
        addEventListener(cancelButton, 'click', () => {
            disableAllInputs(false);
            popupWindow.hide();
        });

        popupWindow.show(promptText, warningText, inputFlexbox, buttonFlexbox);
        otpInput.focus();
    });
}

async function promptForTotpSetup(totpInfo: TOTPInfo.TOTPInfo) {
    const currentPgid = pgid;
    const popupWindowInitialize = await popupWindowImportPromise;
    if (currentPgid !== pgid) {
        return;
    }

    popupWindowInitialize().then((popupWindow) => {
        if (currentPgid !== pgid) {
            return;
        }

        const promptText = createParagraphElement();
        appendText(promptText, '二要素認証を有効にするには、認証アプリを使用して以下のQRコードをスキャンするか、URIを直接入力してください。その後、下の入力欄に二要素認証コードを入力してください。');

        const qrcode = createCanvasElement();
        addClass(qrcode, 'totp-qrcode');
        addClass(qrcode, 'hcenter');
        toCanvas(qrcode, totpInfo.uri, { errorCorrectionLevel: 'H', margin: 0 }, () => {
            qrcode.style.removeProperty('height');
        });

        const uriElem = createParagraphElement();
        addClass(uriElem, 'totp-uri');
        const uriLink = createAnchorElement();
        addClass(uriLink, 'link');
        appendText(uriLink, totpInfo.uri);
        uriLink.href = totpInfo.uri;
        appendChild(uriElem, uriLink);

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
        totpInput.maxLength = 6;
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

        const disableAllPopUpWindowInputs = (disabled: boolean) => {
            disableInput(totpInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        const submit = () => {
            disableAllPopUpWindowInputs(true);
            hideElement(warningText);

            const totp = totpInput.value;
            if (!/^\d{6}$/.test(totp)) {
                showElement(warningText);
                disableAllPopUpWindowInputs(false);
                return;
            }

            sendServerRequest('set_totp', {
                callback: (response: string) => {
                    const mfaWarning = getSharedElement(SHARED_VAR_IDX_MFA_WARNING);
                    if (response === 'EXPIRED') {
                        popupWindow.hide();
                        replaceText(mfaWarning, sessionEnded);
                        showElement(mfaWarning);
                        disableAllInputs(false);
                    } else if (response === 'FAILED TOTP') {
                        showElement(warningText);
                        disableAllPopUpWindowInputs(false);
                    } else if (response === 'ALREADY SET') {
                        popupWindow.hide();
                        changeColor(mfaWarning, 'green');
                        replaceText(mfaWarning, mfaAlreadySet);
                        showElement(mfaWarning);
                        setCurrentMfaStatus(true);
                        changeMfaStatus();
                        disableAllInputs(false);
                    } else {
                        let parsedResponse: RecoveryCodeInfo.RecoveryCodeInfo;
                        try {
                            parsedResponse = JSON.parse(response);
                            RecoveryCodeInfo.check(parsedResponse);
                        } catch (e) {
                            showMessage(invalidResponse());
                            return;
                        }
                        showRecoveryCode(parsedResponse, () => {
                            changeColor(mfaWarning, 'green');
                            replaceText(mfaWarning, mfaEnabled);
                            showElement(mfaWarning);
                            setCurrentMfaStatus(true);
                            changeMfaStatus();
                            disableAllInputs(false);
                        });
                    }
                },
                content: 'p=' + totpInfo.p + '&signature=' + totpInfo.signature + '&totp=' + totp,
                showSessionEndedMessage: true,
            });
        };
        addEventListener(submitButton, 'click', submit);
        addEventListener(totpInput, 'keydown', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                submit();
            }
        });
        addEventListener(cancelButton, 'click', () => {
            disableAllInputs(false);
            popupWindow.hide();
        });

        popupWindow.show(promptText, qrcode, uriElem, warningText, totpInputContainer, buttonFlexbox);
        totpInput.focus();
    });
}

async function showRecoveryCode(recoveryCodes: RecoveryCodeInfo.RecoveryCodeInfo, completedCallback: () => void) {
    const currentPgid = pgid;
    const popupWindowInitialize = await popupWindowImportPromise;
    if (currentPgid !== pgid) {
        return;
    }

    popupWindowInitialize().then((popupWindow) => {
        if (currentPgid !== pgid) {
            return;
        }

        const promptText = createParagraphElement();
        appendText(promptText, 'リカバリーコードを安全な場所に保存してください。リカバリーコードは、二要素認証コードが利用できない場合にアカウントにアクセスするために使用できます。各リカバリコードは1回のみ使用できます。');

        const recoveryCodeContainer = createDivElement();
        addClass(recoveryCodeContainer, 'recovery-codes');
        for (const recoveryCode of recoveryCodes) {
            const recoveryCodeElem = createParagraphElement();
            appendText(recoveryCodeElem, recoveryCode);
            appendChild(recoveryCodeContainer, recoveryCodeElem);
        }

        const closeButton = createButtonElement();
        addClass(closeButton, 'button');
        addClass(closeButton, 'hcenter');

        const closeButtonText = '閉じる';
        closeButton.disabled = true;
        addClass(closeButton, 'not-allowed');
        appendText(closeButton, closeButtonText + '（15秒）');
        let count = 15;
        const interval = addInterval(() => {
            count--;
            if (count <= 0) {
                closeButton.disabled = false;
                removeClass(closeButton, 'not-allowed');
                replaceText(closeButton, closeButtonText);
                removeInterval(interval);
            } else {
                replaceText(closeButton, closeButtonText + '（' + count + '秒）');
            }
        }, 1000);

        addEventListener(closeButton, 'click', () => {
            popupWindow.hide();
            completedCallback();
        });

        popupWindow.show(promptText, recoveryCodeContainer, closeButton);
    });
}