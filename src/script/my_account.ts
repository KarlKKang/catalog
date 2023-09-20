// JavaScript Document
import {
    LOGIN_URL,
} from './module/env/constant';
import {
    addNavBar,
    passwordStyling,
    sendServerRequest,
    changeColor,
    disableInput,
    logout,
    showPage,
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
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
    appendChildren,
    replaceChildren,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent as emailSentParam } from './module/message/template/param';
import { invalidResponse } from './module/message/template/param/server';
import {
    invitationNotQualified,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    emailSent as emailSentInline,
    invalidPasswordFormat,
    passwordConfirmationMismatch,
    passwordChanged,
    usernameEmpty,
    usernameUnchanged,
    usernameChanged,
    usernameTaken,
    emailChangeWait,
    accountDeactivated,
    loginFailed,
    tooManyFailedLogin,
    failedTotp,
    generateRecoveryCodeWait,
    mfaNotSet,
    mfaAlreadySet
} from './module/message/template/inline';
import * as UserInfo from './module/type/UserInfo';
import * as TOTPInfo from './module/type/TOTPInfo';
import * as RecoveryCodeInfo from './module/type/RecoveryCodeInfo';
import isbot from 'isbot';
import { initializePopUpWindow, promptForTotp } from './module/pop_up_window';
import { toCanvas } from 'qrcode';
import { isString } from './module/type/helper';
import { EMAIL_REGEX, PASSWORD_REGEX, handleAuthenticationResult } from './module/main/pure';
import type { HTMLImport } from './module/type/HTMLImport';

let currentUsername: string;
let currentMfaStatus: boolean;

let newUsernameInput: HTMLInputElement;
let newPasswordInput: HTMLInputElement;
let newPasswordComfirmInput: HTMLInputElement;
let inviteReceiverEmailInput: HTMLInputElement;

let emailChangeButton: HTMLButtonElement;
let usernameChangeButton: HTMLButtonElement;
let passwordChangeButton: HTMLButtonElement;
let inviteButton: HTMLButtonElement;
let logoutButton: HTMLButtonElement;
let mfaButton: HTMLButtonElement;
let recoveryCodeButton: HTMLButtonElement;

let emailWarning: HTMLElement;
let usernameWarning: HTMLElement;
let passwordWarning: HTMLElement;
let inviteWarning: HTMLElement;
let mfaWarning: HTMLElement;
let recoveryCodeWarning: HTMLElement;

let mfaInfo: HTMLElement;
let recoveryCodeInfo: HTMLElement;

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    sendServerRequest('get_account', {
        callback: function (response: string) {
            let parsedResponse: UserInfo.UserInfo;
            try {
                parsedResponse = JSON.parse(response);
                UserInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }

            showPage(styleImportPromises, htmlImportPromises, () => {
                showUser(parsedResponse);
            });
        }
    });
}

function showUser(userInfo: UserInfo.UserInfo) {
    newUsernameInput = getById('new-username') as HTMLInputElement;
    newPasswordInput = getById('new-password') as HTMLInputElement;
    newPasswordComfirmInput = getById('new-password-confirm') as HTMLInputElement;
    inviteReceiverEmailInput = getById('receiver-email') as HTMLInputElement;

    emailChangeButton = getById('email-change-button') as HTMLButtonElement;
    usernameChangeButton = getById('username-change-button') as HTMLButtonElement;
    passwordChangeButton = getById('password-change-button') as HTMLButtonElement;
    inviteButton = getById('invite-button') as HTMLButtonElement;
    logoutButton = getById('logout-button') as HTMLButtonElement;
    mfaButton = getById('mfa-button') as HTMLButtonElement;
    recoveryCodeButton = getById('recovery-code-button') as HTMLButtonElement;

    emailWarning = getById('email-warning');
    usernameWarning = getById('username-warning');
    passwordWarning = getById('password-warning');
    inviteWarning = getById('invite-warning');
    mfaWarning = getById('mfa-warning');
    recoveryCodeWarning = getById('recovery-code-warning');

    mfaInfo = getById('mfa-info');
    recoveryCodeInfo = getById('recovery-code-info');

    addEventListener(emailChangeButton, 'click', changeEmail);
    addEventListener(usernameChangeButton, 'click', changeUsername);
    addEventListener(passwordChangeButton, 'click', changePassword);
    addEventListener(mfaButton, 'click', () => {
        if (currentMfaStatus) {
            disableMfa();
        } else {
            enableMfa();
        }
    });
    addEventListener(recoveryCodeButton, 'click', generateRecoveryCode);
    addEventListener(inviteButton, 'click', invite);
    addEventListener(logoutButton, 'click', () => {
        logout(() => {
            disableAllInputs(true);
            redirect(LOGIN_URL);
        });
    });

    passwordStyling(newPasswordInput);
    passwordStyling(newPasswordComfirmInput);

    currentMfaStatus = userInfo.mfa_status;
    changeMfaStatus();
    if (currentMfaStatus) {
        if (userInfo.recovery_code_status === 0) {
            changeColor(recoveryCodeInfo, 'red');
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo.recovery_code_status === 1) {
            changeColor(recoveryCodeInfo, 'orange');
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getById('invite-count'), userInfo.invite_quota.toString());

    newUsernameInput.value = userInfo.username;
    currentUsername = userInfo.username;

    addNavBar('my_account');
}

function invite() {
    disableAllInputs(true);

    const warningElem = inviteWarning;
    const receiver = inviteReceiverEmailInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');
    if (!EMAIL_REGEX.test(receiver)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('send_invite', {
                callback: (response: string) => {
                    const authenticationResult = handleAuthenticationResult(
                        response,
                        () => { faildCallback(loginFailed); },
                        failedTotpCallback,
                        () => { faildCallback([...accountDeactivated()]); },
                        () => { faildCallback(tooManyFailedLogin); },
                    );
                    if (!authenticationResult) {
                        return;
                    }

                    if (response == 'NOT QUALIFIED') {
                        replaceText(warningElem, invitationNotQualified);
                    } else if (response == 'INVALID FORMAT') {
                        replaceText(warningElem, invalidEmailFormat);
                    } else if (response == 'ALREADY REGISTERED') {
                        replaceText(warningElem, emailAlreadyRegistered);
                    } else if (response == 'CLOSED') {
                        replaceText(warningElem, invitationClosed);
                    } else if (response == 'DONE') {
                        showMessage(emailSentParam(true));
                        return;
                    } else {
                        showMessage(invalidResponse);
                        return;
                    }
                    showElement(warningElem);
                    disableAllInputs(false);
                    closeWindow();
                },
                content: authenticationParam + '&receiver=' + encodeURIComponent(receiver)
            });
        }
    );
}

function changePassword() {
    disableAllInputs(true);

    const warningElem = passwordWarning;
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (!PASSWORD_REGEX.test(newPassword)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newPassword != newPasswordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('change_password', {
                callback: (response: string) => {
                    const authenticationResult = handleAuthenticationResult(
                        response,
                        () => { faildCallback(loginFailed); },
                        failedTotpCallback,
                        () => { faildCallback([...accountDeactivated()]); },
                        () => { faildCallback(tooManyFailedLogin); },
                    );
                    if (!authenticationResult) {
                        return;
                    }

                    if (response == 'DONE') {
                        replaceText(warningElem, passwordChanged);
                        changeColor(warningElem, 'green');
                    } else if (response === 'PASSWORD INVALID') {
                        replaceText(warningElem, invalidPasswordFormat);
                    } else {
                        showMessage();
                        return;
                    }
                    showElement(warningElem);
                    disableAllInputs(false);
                    closeWindow();
                },
                content: authenticationParam + '&new=' + encodeURIComponent(newPassword)
            });
        }
    );
}

function changeEmail() {
    disableAllInputs(true);

    const warningElem = emailWarning;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    sendServerRequest('send_email_change', {
        callback: function (response: string) {
            if (response == 'WAIT') {
                replaceText(warningElem, emailChangeWait);
            } else if (response == 'DONE') {
                replaceText(warningElem, emailSentInline);
                changeColor(warningElem, 'green');
            } else {
                showMessage();
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        }
    });
}

function changeUsername() {
    disableAllInputs(true);

    const warningElem = usernameWarning;
    const newUsername = newUsernameInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (newUsername == '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername == currentUsername) {
        replaceText(warningElem, usernameUnchanged);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('change_username', {
                callback: (response: string) => {
                    const authenticationResult = handleAuthenticationResult(
                        response,
                        () => { faildCallback(loginFailed); },
                        failedTotpCallback,
                        () => { faildCallback([...accountDeactivated()]); },
                        () => { faildCallback(tooManyFailedLogin); },
                    );
                    if (!authenticationResult) {
                        return;
                    }

                    if (response == 'DONE') {
                        replaceText(warningElem, usernameChanged);
                        changeColor(warningElem, 'green');
                        currentUsername = newUsername;
                    } else if (response == 'DUPLICATED') {
                        replaceText(warningElem, usernameTaken);
                    } else if (response == 'EMPTY') {
                        replaceText(warningElem, usernameEmpty);
                    } else {
                        showMessage();
                        return;
                    }
                    showElement(warningElem);
                    disableAllInputs(false);
                    closeWindow();
                },
                content: authenticationParam + '&new=' + encodeURIComponent(newUsername)
            });
        }
    );
}

function enableMfa() {
    disableAllInputs(true);
    hideElement(mfaWarning);

    modifyMfaReauthenticationPrompt(
        (
            content: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            otpSentCallback?: () => void,
            failedOtpCallback?: () => void,
        ) => {
            sendServerRequest('generate_totp', {
                callback: (response: string) => {
                    const authenticationResult = handleAuthenticationResult(
                        response,
                        () => { faildCallback(loginFailed); },
                        () => {
                            closeWindow();
                            changeColor(mfaWarning, 'green');
                            replaceText(mfaWarning, mfaAlreadySet);
                            showElement(mfaWarning);
                            currentMfaStatus = true;
                            changeMfaStatus();
                            disableAllInputs(false);
                        },
                        () => { faildCallback([...accountDeactivated()]); },
                        () => { faildCallback(tooManyFailedLogin); },
                    );
                    if (!authenticationResult) {
                        return;
                    }

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
                            showMessage(invalidResponse);
                            return;
                        }
                        promptForTotpSetup(parsedResponse);
                    }
                },
                content: content
            });
        }
    );
}

function disableMfa() {
    disableAllInputs(true);
    hideElement(mfaWarning);

    modifyMfaReauthenticationPrompt(
        (
            content: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            otpSentCallback?: () => void,
            failedOtpCallback?: () => void,
        ) => {
            sendServerRequest('disable_totp', {
                callback: (response: string) => {
                    if (response == 'FAILED') {
                        faildCallback(loginFailed);
                    } else if (response == 'DEACTIVATED') {
                        faildCallback([...accountDeactivated()]);
                    } else if (response == 'TOO MANY REQUESTS') {
                        faildCallback(tooManyFailedLogin);
                    } else if (response == 'FAILED EMAIL OTP') {
                        failedOtpCallback?.();
                    } else if (response == 'SENT') {
                        otpSentCallback?.();
                    } else if (response == 'DONE') {
                        closeWindow();
                        changeColor(mfaWarning, 'green');
                        replaceText(mfaWarning, '二要素認証が無効になりました。');
                        showElement(mfaWarning);
                        currentMfaStatus = false;
                        changeMfaStatus();
                        disableAllInputs(false);
                    } else {
                        showMessage();
                    }
                },
                content: content
            });
        }
    );
}

function generateRecoveryCode() {
    disableAllInputs(true);
    hideElement(recoveryCodeWarning);
    reauthenticationPrompt(
        (
            authenticationParam: string,
            closeWindow: () => void,
            faildCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => {
            sendServerRequest('generate_recovery_code', {
                callback: (response: string) => {
                    const authenticationResult = handleAuthenticationResult(
                        response,
                        () => { faildCallback(loginFailed); },
                        failedTotpCallback,
                        () => { faildCallback([...accountDeactivated()]); },
                        () => { faildCallback(tooManyFailedLogin); },
                    );
                    if (!authenticationResult) {
                        return;
                    }

                    if (response == 'TOTP NOT SET') {
                        closeWindow();
                        changeColor(recoveryCodeWarning, 'red');
                        replaceText(recoveryCodeWarning, mfaNotSet);
                        showElement(recoveryCodeWarning);
                        disableAllInputs(false);
                    } else if (response == 'WAIT') {
                        closeWindow();
                        changeColor(recoveryCodeWarning, 'red');
                        replaceText(recoveryCodeWarning, generateRecoveryCodeWait);
                        showElement(recoveryCodeWarning);
                        disableAllInputs(false);
                    } else {
                        let parsedResponse: RecoveryCodeInfo.RecoveryCodeInfo;
                        try {
                            parsedResponse = JSON.parse(response);
                            RecoveryCodeInfo.check(parsedResponse);
                        } catch (e) {
                            showMessage(invalidResponse);
                            return;
                        }
                        showRecoveryCode(parsedResponse);
                    }
                },
                content: authenticationParam
            });
        },
        true
    );
}

function reauthenticationPrompt(
    sendRequestCallback: (
        authenticationParam: string,
        closeWindow: () => void,
        faildCallback: (message: string | Node[]) => void,
        failedTotpCallback: () => void,
    ) => void,
    directTotpPrompt = false,
    message?: string | Node[]
) {
    promptForLogin(
        (email, password, closeWindow, showWarning) => {
            const emailEncoded = encodeURIComponent(email);
            const passwordEncoded = encodeURIComponent(password);

            const failedTotpCallback = () => {
                promptForTotp(
                    (totp, closeWindow, showWarning) => {
                        sendRequestCallback(
                            'email=' + emailEncoded + '&password=' + passwordEncoded + '&totp=' + totp,
                            closeWindow,
                            (message: string | Node[]) => { reauthenticationPrompt(sendRequestCallback, directTotpPrompt, message); },
                            showWarning
                        );
                    },
                    () => { disableAllInputs(false); },
                );
            };

            if (directTotpPrompt) {
                failedTotpCallback();
            } else {
                sendRequestCallback(
                    'email=' + emailEncoded + '&password=' + passwordEncoded,
                    closeWindow,
                    showWarning,
                    failedTotpCallback
                );
            }
        },
        message
    );
}

function modifyMfaReauthenticationPrompt(
    sendRequestCallback: (
        content: string,
        closeWindow: () => void,
        faildCallback: (message: string | Node[]) => void,
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

function promptForEmailOtp(
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
    initializePopUpWindow().then((popUpWindow) => {
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
            const interval = setInterval(() => {
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

        addEventListener(resendButton, 'click', () => {
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

            const otp = otpInput.value;
            if (!/^[2-9A-HJ-NP-Z]{6}$/.test(otp)) {
                showElement(warningText);
                disableAllPopUpWindowInputs(false);
                return;
            }

            submitCallback(
                otp,
                popUpWindow.hide,
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
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, inputFlexbox, buttonFlexbox);
    });
}

function promptForLogin(
    submitCallback: (
        email: string,
        password: string,
        closeWindow: () => void,
        showWarning: (message: string | Node[]) => void,
    ) => void,
    message?: string | Node[]
) {
    initializePopUpWindow().then((popUpWindow) => {
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

        const disableAllPopUpWindowInputs = (disabled: boolean) => {
            disableInput(emailInput, disabled);
            disableInput(passwordInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        const submit = () => {
            disableAllPopUpWindowInputs(true);
            hideElement(warningText);

            const showWarning = (message: string | Node[]) => {
                if (isString(message)) {
                    replaceText(warningText, message as string);
                } else {
                    replaceChildren(warningText, ...message as Node[]);
                }
                showElement(warningText);
                disableAllPopUpWindowInputs(false);
            };

            const email = emailInput.value;
            const password = passwordInput.value;
            if (!EMAIL_REGEX.test(email) || !PASSWORD_REGEX.test(password)) {
                showWarning(loginFailed);
                return;
            }

            submitCallback(
                email,
                password,
                popUpWindow.hide,
                showWarning
            );
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
            disableAllInputs(false);
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox);
    });
}

function promptForTotpSetup(totpInfo: TOTPInfo.TOTPInfo) {
    initializePopUpWindow().then((popUpWindow) => {
        const promptText = createParagraphElement();
        appendText(promptText, '二要素認証を有効にするには、Authenticatorアプリを使用して以下のQRコードをスキャンするか、URIを直接入力してください。その後、下の入力欄に二要素認証コードを入力してください。');

        const qrcode = createCanvasElement();
        addClass(qrcode, 'totp-qrcode');
        addClass(qrcode, 'hcenter');
        toCanvas(qrcode, totpInfo.uri, { errorCorrectionLevel: 'H' }, () => {
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
                    if (response === 'EXPIRED') {
                        popUpWindow.hide();
                        changeColor(mfaWarning, 'red');
                        replaceText(mfaWarning, 'セッションが終了しました。もう一度お試しください。');
                        showElement(mfaWarning);
                        disableAllInputs(false);
                    } else if (response === 'FAILED TOTP') {
                        showElement(warningText);
                        disableAllPopUpWindowInputs(false);
                    } else if (response === 'ALREADY SET') {
                        popUpWindow.hide();
                        changeColor(mfaWarning, 'green');
                        replaceText(mfaWarning, mfaAlreadySet);
                        showElement(mfaWarning);
                        currentMfaStatus = true;
                        changeMfaStatus();
                        disableAllInputs(false);
                    } else {
                        let parsedResponse: RecoveryCodeInfo.RecoveryCodeInfo;
                        try {
                            parsedResponse = JSON.parse(response);
                            RecoveryCodeInfo.check(parsedResponse);
                        } catch (e) {
                            showMessage(invalidResponse);
                            return;
                        }
                        showRecoveryCode(parsedResponse);
                    }
                },
                content: 'p=' + totpInfo.p + '&signature=' + totpInfo.signature + '&totp=' + totp
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
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, qrcode, uriElem, warningText, totpInputContainer, buttonFlexbox);
    });
}

function showRecoveryCode(recoveryCodes: RecoveryCodeInfo.RecoveryCodeInfo) {
    initializePopUpWindow().then((popUpWindow) => {
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
        closeButton.style.cursor = 'not-allowed';
        appendText(closeButton, closeButtonText + '（15秒）');
        let count = 15;
        const interval = setInterval(() => {
            count--;
            if (count <= 0) {
                closeButton.disabled = false;
                closeButton.style.removeProperty('cursor');
                replaceText(closeButton, closeButtonText);
                clearInterval(interval);
            } else {
                replaceText(closeButton, closeButtonText + '（' + count + '秒）');
            }
        }, 1000);

        addEventListener(closeButton, 'click', () => {
            popUpWindow.hide();
            currentMfaStatus = true;
            changeMfaStatus();
            disableAllInputs(false);
        });

        popUpWindow.show(promptText, recoveryCodeContainer, closeButton);
    });
}

function changeMfaStatus() {
    if (currentMfaStatus) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, '無効にする');
        hideElement(recoveryCodeInfo);
        recoveryCodeButton.disabled = false;
        recoveryCodeButton.style.removeProperty('cursor');
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');
        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(recoveryCodeWarning);
        recoveryCodeButton.disabled = true;
        recoveryCodeButton.style.cursor = 'not-allowed';
    }
}

function disableAllInputs(disabled: boolean) {
    disableInput(newUsernameInput, disabled);
    disableInput(newPasswordInput, disabled);
    disableInput(newPasswordComfirmInput, disabled);
    disableInput(inviteReceiverEmailInput, disabled);

    emailChangeButton.disabled = disabled;
    usernameChangeButton.disabled = disabled;
    passwordChangeButton.disabled = disabled;
    mfaButton.disabled = disabled;
    inviteButton.disabled = disabled;
    logoutButton.disabled = disabled;
}