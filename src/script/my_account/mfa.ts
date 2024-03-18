
import { sendServerRequest } from '../module/server_request';
import {
    addEventListener,
    appendText,
    replaceText,
    createCanvasElement,
    createParagraphElement,
    createDivElement,
    addClass,
    appendChild,
    createButtonElement,
    createAnchorElement,
    removeClass,
    replaceChildren,
    createTotpInput,
    disableInput,
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
    accountDeactivated,
    tooManyFailedLogin,
    loginFailed,
    submitButtonText,
    cancelButtonText,
} from '../module/message/template/inline';
import * as TOTPInfo from '../module/type/TOTPInfo';
import * as RecoveryCodeInfo from '../module/type/RecoveryCodeInfo';
import { toCanvas } from 'qrcode';
import { addInterval, removeInterval } from '../module/timer';
import { pgid } from '../module/global';
import { SHARED_VAR_IDX_MFA_WARNING, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_RECOVERY_CODE_WARNING, getSharedElement } from './shared_var';
import { changeMfaStatus, disableAllInputs } from './helper';
import { handleFailedLogin, reauthenticationPrompt } from './auth_helper';
import { popupWindowImportPromise } from './import_promise';
import { promptForEmailOtp, type EmailOtpPopupWindow } from './email_otp_popup_window';
import type { LoginPopupWindow } from './login_popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/common/pure';
import { changeColor, hideElement, horizontalCenter, setHeight, showElement } from '../module/style';

export function enableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SHARED_VAR_IDX_MFA_WARNING);

    hideElement(mfaWarning);
    changeColor(mfaWarning, 'red');

    modifyMfaReauthenticationPrompt(
        'generate_totp',
        (response: string) => {
            if (response === AUTH_FAILED_TOTP) {
                changeMfaStatus(true);
                changeColor(mfaWarning, 'green');
                replaceText(mfaWarning, mfaAlreadySet);
                showElement(mfaWarning);
                disableAllInputs(false);
                return true;
            }
            let parsedResponse: TOTPInfo.TOTPInfo;
            try {
                parsedResponse = JSON.parse(response);
                TOTPInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return false;
            }
            promptForTotpSetup(parsedResponse);
            return false;
        },
        mfaWarning
    );
}

export function disableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SHARED_VAR_IDX_MFA_WARNING);

    hideElement(mfaWarning);
    changeColor(mfaWarning, 'red');

    modifyMfaReauthenticationPrompt(
        'disable_totp',
        (response: string) => {
            if (response === 'DONE') {
                changeMfaStatus(false);
                changeColor(mfaWarning, 'green');
                replaceText(mfaWarning, mfaDisabled);
                showElement(mfaWarning);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            disableAllInputs(false);
            return true;
        },
        mfaWarning
    );
}

export function generateRecoveryCode() {
    disableAllInputs(true);
    const recoveryCodeWarning = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_WARNING);

    hideElement(recoveryCodeWarning);
    changeColor(recoveryCodeWarning, 'red');

    reauthenticationPrompt(
        'generate_recovery_code',
        (response: string) => {
            if (response === 'TOTP NOT SET') {
                changeMfaStatus(false);
                replaceText(recoveryCodeWarning, mfaNotSet);
                showElement(recoveryCodeWarning);
                disableAllInputs(false);
            } else if (response === 'WAIT') {
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
                    return false;
                }
                showRecoveryCode(parsedResponse, () => {
                    hideElement(getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO));
                    disableAllInputs(false);
                });
                return false;
            }
            return true;
        },
        recoveryCodeWarning,
        undefined,
        true,
    );
}

export function modifyMfaReauthenticationPrompt(
    uri: string,
    callback: (response: string) => boolean,
    warningElem: HTMLElement,
    content?: string,
    loginPopupWindow?: LoginPopupWindow,
    emailOtpPopupWindow?: EmailOtpPopupWindow,
) {
    if (loginPopupWindow === undefined) {
        handleFailedLogin(
            undefined,
            () => {
                disableAllInputs(false);
            },
            (loginPopupWindow) => {
                modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow);
            },
        );
        return;
    }
    sendServerRequest(uri, {
        callback: (response: string) => {
            const closeAll = () => {
                emailOtpPopupWindow?.[2]();
                loginPopupWindow[3]();
            };
            switch (response) {
                case AUTH_DEACTIVATED:
                    replaceChildren(warningElem, ...accountDeactivated());
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_TOO_MANY_REQUESTS:
                    replaceText(warningElem, tooManyFailedLogin);
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_FAILED:
                    handleFailedLogin(
                        emailOtpPopupWindow === undefined ? loginPopupWindow : undefined,
                        () => {
                            disableAllInputs(false);
                        },
                        (loginPopupWindow) => {
                            modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow);
                        },
                        loginFailed,
                    );
                    break;
                case 'FAILED EMAIL OTP':
                case 'SENT':
                    handleFailedEmailOtp(
                        emailOtpPopupWindow,
                        () => {
                            disableAllInputs(false);
                        },
                        (emailOtpPopupWindow) => {
                            modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow, emailOtpPopupWindow);
                        },
                    );
                    break;
                default:
                    if (callback(response)) {
                        closeAll();
                    }
            }
        },
        content: (content === undefined ? '' : content + '&') + 'email=' + encodeURIComponent(loginPopupWindow[0]) + '&password=' + encodeURIComponent(loginPopupWindow[1]) + (emailOtpPopupWindow === undefined || emailOtpPopupWindow[0] === undefined ? '' : '&otp=' + emailOtpPopupWindow[0]),
        showSessionEndedMessage: true,
    });
}

async function handleFailedEmailOtp(
    currentEmailOtpPopupWindow: EmailOtpPopupWindow | undefined,
    closeCallback: () => void,
    retryCallback: (emailOtpPopupWindow: EmailOtpPopupWindow) => void,
) {
    const currentPgid = pgid;
    let emailOtpPopupWindowPromise: Promise<EmailOtpPopupWindow>;
    if (currentEmailOtpPopupWindow === undefined) {
        const popupWindow = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        emailOtpPopupWindowPromise = promptForEmailOtp(popupWindow.initializePopupWindow);
    } else {
        emailOtpPopupWindowPromise = currentEmailOtpPopupWindow[1]();
    }

    try {
        currentEmailOtpPopupWindow = await emailOtpPopupWindowPromise;
    } catch (e) {
        if (currentPgid !== pgid) {
            return;
        }
        closeCallback();
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    retryCallback(currentEmailOtpPopupWindow);
}

async function promptForTotpSetup(totpInfo: TOTPInfo.TOTPInfo) {
    const currentPgid = pgid;
    const popupWindowInitialize = (await popupWindowImportPromise).initializePopupWindow;
    if (currentPgid !== pgid) {
        return;
    }

    const promptText = createParagraphElement('二要素認証を有効にするには、認証アプリを使用して以下のQRコードをスキャンするか、URIを直接入力してください。その後、下の入力欄に二要素認証コードを入力してください。');

    const qrcode = createCanvasElement();
    addClass(qrcode, 'totp-qrcode');
    horizontalCenter(qrcode);
    toCanvas(qrcode, totpInfo.uri, { errorCorrectionLevel: 'H', margin: 0 }, () => {
        setHeight(qrcode, null);
    });

    const uriElem = createParagraphElement();
    addClass(uriElem, 'totp-uri');
    const uriLink = createAnchorElement();
    addClass(uriLink, 'link');
    appendText(uriLink, totpInfo.uri);
    uriLink.href = totpInfo.uri;
    appendChild(uriElem, uriLink);

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, 'red');
    hideElement(warningText);

    const [totpInputContainer, totpInput] = createTotpInput(false);
    horizontalCenter(totpInputContainer);

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, 'input-flexbox');
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const hidePopupWindow = popupWindowInitialize(
        [promptText, qrcode, uriElem, warningText, totpInputContainer, buttonFlexbox],
        () => { totpInput.focus(); },
    );

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
                    hidePopupWindow();
                    replaceText(mfaWarning, sessionEnded);
                    showElement(mfaWarning);
                    disableAllInputs(false);
                } else if (response === 'FAILED TOTP') {
                    showElement(warningText);
                    disableAllPopUpWindowInputs(false);
                } else if (response === 'ALREADY SET') {
                    hidePopupWindow();
                    changeMfaStatus(true);
                    changeColor(mfaWarning, 'green');
                    replaceText(mfaWarning, mfaAlreadySet);
                    showElement(mfaWarning);
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
                        changeMfaStatus(true);
                        changeColor(mfaWarning, 'green');
                        replaceText(mfaWarning, mfaEnabled);
                        showElement(mfaWarning);
                        disableAllInputs(false);
                    });
                }
            },
            content: 'p=' + totpInfo.p + '&totp=' + totp,
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
        hidePopupWindow();
    });
}

async function showRecoveryCode(recoveryCodes: RecoveryCodeInfo.RecoveryCodeInfo, completedCallback: () => void) {
    const currentPgid = pgid;
    const popupWindowInitialize = (await popupWindowImportPromise).initializePopupWindow;
    if (currentPgid !== pgid) {
        return;
    }

    const promptText = createParagraphElement('リカバリーコードを安全な場所に保存してください。リカバリーコードは、二要素認証コードが利用できない場合にアカウントにアクセスするために使用できます。各リカバリコードは1回のみ使用できます。');

    const recoveryCodeContainer = createDivElement();
    addClass(recoveryCodeContainer, 'recovery-codes');
    for (const recoveryCode of recoveryCodes) {
        const recoveryCodeElem = createParagraphElement(recoveryCode);
        appendChild(recoveryCodeContainer, recoveryCodeElem);
    }

    const closeButtonText = '閉じる';
    const closeButton = createButtonElement(closeButtonText + '（15秒）');
    horizontalCenter(closeButton);
    closeButton.disabled = true;
    addClass(closeButton, 'not-allowed');
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

    const hidePopupWindow = popupWindowInitialize([promptText, recoveryCodeContainer, closeButton]);

    addEventListener(closeButton, 'click', () => {
        hidePopupWindow();
        completedCallback();
    });
}