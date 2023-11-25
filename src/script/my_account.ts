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
    NAV_BAR_MY_ACCOUNT,
} from './module/common';
import {
    addEventListener,
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
    remove,
    prependChild,
    removeClass,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import {
    invitationNotQualified,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    emailSent,
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
    mfaAlreadySet,
    sessionEnded,
    logoutDone,
    mfaDisabled,
    mfaEnabled,
    loginNotificationEnabled,
    loginNotificationDisabled,
} from './module/message/template/inline';
import * as AccountInfo from './module/type/AccountInfo';
import * as TOTPInfo from './module/type/TOTPInfo';
import * as RecoveryCodeInfo from './module/type/RecoveryCodeInfo';
import { popupWindowImport, promptForTotpImport } from './module/popup_window';
import { toCanvas } from 'qrcode';
import { isString } from './module/type/helper';
import { EMAIL_REGEX, PASSWORD_REGEX, getLocalTimeString, handleAuthenticationResult } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { addInterval, removeInterval } from './module/timer';
import type { RedirectFunc } from './module/type/RedirectFunc';
import { UAParser } from 'ua-parser-js';
import * as InviteResult from './module/type/InviteResult';
import { pgid } from './module/global';

let destroyPopupWindow: null | (() => void) = null;

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    sendServerRequest(redirect, 'get_account', {
        callback: function (response: string) {
            let parsedResponse: AccountInfo.AccountInfo;
            try {
                parsedResponse = JSON.parse(response);
                AccountInfo.check(parsedResponse);
            } catch (e) {
                showMessage(redirect, invalidResponse());
                return;
            }

            showPage(() => { showPageCallback(parsedResponse, redirect); });
        }
    });
}

function showPageCallback(userInfo: AccountInfo.AccountInfo, redirect: RedirectFunc) {
    const currentPgid = pgid;

    let currentUsername = userInfo.username;
    let currentMfaStatus = userInfo.mfa_status;
    let currentLoginNotificationStatus = userInfo.login_notification;

    const newUsernameInput = getById('new-username') as HTMLInputElement;
    const newPasswordInput = getById('new-password') as HTMLInputElement;
    const newPasswordComfirmInput = getById('new-password-confirm') as HTMLInputElement;
    const inviteReceiverEmailInput = getById('receiver-email') as HTMLInputElement;

    const emailChangeButton = getById('email-change-button') as HTMLButtonElement;
    const usernameChangeButton = getById('username-change-button') as HTMLButtonElement;
    const passwordChangeButton = getById('password-change-button') as HTMLButtonElement;
    const inviteButton = getById('invite-button') as HTMLButtonElement;
    const logoutButton = getById('logout-button') as HTMLButtonElement;
    const mfaButton = getById('mfa-button') as HTMLButtonElement;
    const recoveryCodeButton = getById('recovery-code-button') as HTMLButtonElement;
    const loginNotificationButton = getById('login-notification-button') as HTMLButtonElement;

    const emailWarning = getById('email-warning');
    const usernameWarning = getById('username-warning');
    const passwordWarning = getById('password-warning');
    const inviteWarning = getById('invite-warning');
    const mfaWarning = getById('mfa-warning');
    const recoveryCodeWarning = getById('recovery-code-warning');
    const loginNotificationWarning = getById('login-notification-warning');

    const inviteCount = getById('invite-count');
    const mfaInfo = getById('mfa-info');
    const recoveryCodeInfo = getById('recovery-code-info');
    const loginNotificationInfo = getById('login-notification-info');
    const sessionsContainer = getById('sessions');

    const popupWindowImportPromise = popupWindowImport(redirect);
    const promptForTotpImportPromise = promptForTotpImport(redirect);

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
        disableAllInputs(true);
        logout(redirect, () => {
            redirect(LOGIN_URL);
        });
    });
    addEventListener(loginNotificationButton, 'click', changeLoginNotification);

    passwordStyling(newPasswordInput);
    passwordStyling(newPasswordComfirmInput);

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

    appendText(inviteCount, userInfo.invite_quota.toString());
    newUsernameInput.value = currentUsername;
    showSessions();

    addNavBar(redirect, NAV_BAR_MY_ACCOUNT);

    function showSessions() {
        for (const session of userInfo.sessions) {
            const outerContainer = createDivElement();
            const innerContainer = createDivElement();
            appendChild(outerContainer, innerContainer);

            appendParagraph('場所：' + session.country, innerContainer);
            appendParagraph('IPアドレス：' + session.ip, innerContainer);

            const ua = UAParser(session.ua);
            const UNKNOWN = '不明';
            let browser = ua.browser.name;
            if (browser === undefined) {
                browser = UNKNOWN;
            } else {
                const browserVer = ua.browser.version;
                if (browserVer !== undefined) {
                    browser += ' ' + browserVer;
                }
            }
            let os = ua.os.name;
            if (os === undefined) {
                os = UNKNOWN;
            } else {
                const osVer = ua.os.version;
                if (osVer !== undefined) {
                    os += ' ' + osVer;
                }
            }
            appendParagraph('ブラウザ：' + browser, innerContainer);
            appendParagraph('OS：' + os, innerContainer);

            appendParagraph('最初のログイン：' + getLocalTimeString(session.login_time, true, true), innerContainer);
            appendParagraph('最近のアクティビティ：' + getLocalTimeString(session.last_active_time, true, true), innerContainer);

            const sessionID = session.id;

            if (sessionID === undefined) {
                const thisDevicePrompt = createParagraphElement();
                addClass(thisDevicePrompt, 'warning');
                appendText(thisDevicePrompt, '※このデバイスです。');
                appendChild(innerContainer, thisDevicePrompt);
                prependChild(sessionsContainer, outerContainer);
            } else {
                const sessionWarningElem = createParagraphElement();
                addClass(sessionWarningElem, 'warning');
                hideElement(sessionWarningElem);
                appendChild(innerContainer, sessionWarningElem);

                const sessionLogoutButton = createButtonElement();
                addClass(sessionLogoutButton, 'button');
                appendText(sessionLogoutButton, 'ログアウト');
                appendChild(innerContainer, sessionLogoutButton);

                addEventListener(sessionLogoutButton, 'click', () => {
                    hideElement(sessionWarningElem);
                    changeColor(sessionWarningElem, 'red');
                    reauthenticationPrompt(
                        (
                            authenticationParam: string,
                            closeWindow: () => void,
                            failedCallback: (message: string | Node[]) => void,
                            failedTotpCallback: () => void,
                        ) => {
                            sendServerRequest(redirect, 'logout_session', {
                                callback: (response: string) => {
                                    serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                                        if (response == 'DONE') {
                                            remove(sessionLogoutButton);
                                            changeColor(sessionWarningElem, 'green');
                                            replaceText(sessionWarningElem, logoutDone);
                                        } else {
                                            showMessage(redirect, invalidResponse());
                                            return;
                                        }
                                        showElement(sessionWarningElem);
                                        closeWindow();
                                    });
                                },
                                content: authenticationParam + '&id=' + sessionID,
                                showSessionEndedMessage: true,
                            });
                        },
                        sessionWarningElem
                    );
                });
                appendChild(sessionsContainer, outerContainer);
            }
        }
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
                failedCallback: (message: string | Node[]) => void,
                failedTotpCallback: () => void,
            ) => {
                sendServerRequest(redirect, 'send_invite', {
                    callback: (response: string) => {
                        serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                            if (response == 'NOT QUALIFIED') {
                                replaceText(inviteCount, '0');
                                replaceText(warningElem, invitationNotQualified);
                            } else if (response == 'INVALID FORMAT') {
                                replaceText(warningElem, invalidEmailFormat);
                            } else if (response == 'ALREADY REGISTERED') {
                                replaceText(warningElem, emailAlreadyRegistered);
                            } else if (response == 'CLOSED') {
                                replaceText(warningElem, invitationClosed);
                            } else {
                                let parsedResponse: InviteResult.InviteResult;
                                try {
                                    parsedResponse = JSON.parse(response);
                                    InviteResult.check(parsedResponse);
                                } catch (e) {
                                    showMessage(redirect, invalidResponse());
                                    return;
                                }
                                replaceText(inviteCount, parsedResponse.quota.toString());
                                let message = emailSent;
                                if (parsedResponse.special) {
                                    message += '現在、一般登録を受け付けているため、招待券はかかりませんでした。';
                                }
                                replaceText(warningElem, message);
                                changeColor(warningElem, 'green');
                            }
                            showElement(warningElem);
                            disableAllInputs(false);
                            closeWindow();
                        });
                    },
                    content: authenticationParam + '&receiver=' + encodeURIComponent(receiver),
                    showSessionEndedMessage: true,
                });
            },
            warningElem
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
                failedCallback: (message: string | Node[]) => void,
                failedTotpCallback: () => void,
            ) => {
                sendServerRequest(redirect, 'change_password', {
                    callback: (response: string) => {
                        serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                            if (response == 'DONE') {
                                replaceText(warningElem, passwordChanged);
                                changeColor(warningElem, 'green');
                                newPasswordInput.value = '';
                                newPasswordComfirmInput.value = '';
                            } else if (response === 'PASSWORD INVALID') {
                                replaceText(warningElem, invalidPasswordFormat);
                            } else {
                                showMessage(redirect);
                                return;
                            }
                            showElement(warningElem);
                            disableAllInputs(false);
                            closeWindow();
                        });
                    },
                    content: authenticationParam + '&new=' + encodeURIComponent(newPassword),
                    showSessionEndedMessage: true,
                });
            },
            warningElem
        );
    }

    function changeEmail() {
        disableAllInputs(true);

        const warningElem = emailWarning;

        hideElement(warningElem);
        changeColor(warningElem, 'red');

        sendServerRequest(redirect, 'send_email_change', {
            callback: function (response: string) {
                if (response == 'WAIT') {
                    replaceText(warningElem, emailChangeWait);
                } else if (response == 'DONE') {
                    replaceText(warningElem, emailSent);
                    changeColor(warningElem, 'green');
                } else {
                    showMessage(redirect);
                    return;
                }
                showElement(warningElem);
                disableAllInputs(false);
            },
            showSessionEndedMessage: true,
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
                failedCallback: (message: string | Node[]) => void,
                failedTotpCallback: () => void,
            ) => {
                sendServerRequest(redirect, 'change_username', {
                    callback: (response: string) => {
                        serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                            if (response == 'DONE') {
                                replaceText(warningElem, usernameChanged);
                                changeColor(warningElem, 'green');
                                currentUsername = newUsername;
                            } else if (response == 'DUPLICATED') {
                                replaceText(warningElem, usernameTaken);
                            } else if (response == 'EMPTY') {
                                replaceText(warningElem, usernameEmpty);
                            } else {
                                showMessage(redirect);
                                return;
                            }
                            showElement(warningElem);
                            disableAllInputs(false);
                            closeWindow();
                        });
                    },
                    content: authenticationParam + '&new=' + encodeURIComponent(newUsername),
                    showSessionEndedMessage: true,
                });
            },
            warningElem
        );
    }

    function enableMfa() {
        disableAllInputs(true);
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
                sendServerRequest(redirect, 'generate_totp', {
                    callback: (response: string) => {
                        serverResponseCallback(response, failedCallback, () => {
                            closeWindow();
                            changeColor(mfaWarning, 'green');
                            replaceText(mfaWarning, mfaAlreadySet);
                            showElement(mfaWarning);
                            currentMfaStatus = true;
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
                                    showMessage(redirect, invalidResponse());
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

    function disableMfa() {
        disableAllInputs(true);
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
                sendServerRequest(redirect, 'disable_totp', {
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
                                currentMfaStatus = false;
                                currentLoginNotificationStatus = true;
                                changeMfaStatus();
                                disableAllInputs(false);
                            } else {
                                showMessage(redirect);
                            }
                        });
                    },
                    content: content,
                    showSessionEndedMessage: true,
                });
            }
        );
    }

    function generateRecoveryCode() {
        disableAllInputs(true);
        hideElement(recoveryCodeWarning);
        changeColor(recoveryCodeWarning, 'red');

        reauthenticationPrompt(
            (
                authenticationParam: string,
                closeWindow: () => void,
                failedCallback: (message: string | Node[]) => void,
                failedTotpCallback: () => void,
            ) => {
                sendServerRequest(redirect, 'generate_recovery_code', {
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
                                    showMessage(redirect, invalidResponse());
                                    return;
                                }
                                showRecoveryCode(parsedResponse, () => {
                                    hideElement(recoveryCodeInfo);
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

    function changeLoginNotification() {
        disableAllInputs(true);

        const warningElem = loginNotificationWarning;

        hideElement(warningElem);
        changeColor(warningElem, 'red');

        const loginNotificationTargetStatus = !currentLoginNotificationStatus;

        reauthenticationPrompt(
            (
                authenticationParam: string,
                closeWindow: () => void,
                failedCallback: (message: string | Node[]) => void,
                failedTotpCallback: () => void,
            ) => {
                sendServerRequest(redirect, 'change_login_notification', {
                    callback: (response: string) => {
                        serverResponseCallback(response, failedCallback, failedTotpCallback, () => {
                            if (response == 'DONE') {
                                currentLoginNotificationStatus = loginNotificationTargetStatus;
                                replaceText(warningElem, loginNotificationTargetStatus ? loginNotificationEnabled : loginNotificationDisabled);
                                changeColor(warningElem, 'green');
                            } else if (response == 'TOTP NOT SET') {
                                currentLoginNotificationStatus = true;
                                currentMfaStatus = false;
                                replaceText(warningElem, mfaNotSet);
                            } else {
                                showMessage(redirect, invalidResponse());
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

    function reauthenticationPrompt(
        sendRequestCallback: (
            authenticationParam: string,
            closeWindow: () => void,
            failedCallback: (message: string | Node[]) => void,
            failedTotpCallback: () => void,
        ) => void,
        warningElem: HTMLElement,
        directTotpPrompt = false,
        message?: string | Node[]
    ) {
        promptForLogin(
            (email, password, closeWindow, showWarning) => {
                const emailEncoded = encodeURIComponent(email);
                const passwordEncoded = encodeURIComponent(password);

                const failedTotpCallback = async () => {
                    const popupWindowModule = await popupWindowImportPromise;
                    const promptForTotp = (await promptForTotpImportPromise).promptForTotp;
                    if (currentPgid !== pgid) {
                        return;
                    }
                    destroyPopupWindow = popupWindowModule.destroy;

                    promptForTotp(
                        popupWindowModule.initializePopupWindow,
                        (totp, closeWindow, showWarning) => {
                            sendRequestCallback(
                                'email=' + emailEncoded + '&password=' + passwordEncoded + '&totp=' + totp,
                                closeWindow,
                                (message: string | Node[]) => { reauthenticationPrompt(sendRequestCallback, warningElem, directTotpPrompt, message); },
                                showWarning
                            );
                        },
                        () => { disableAllInputs(false); },
                        () => {
                            replaceText(warningElem, sessionEnded);
                            showElement(warningElem);
                        },
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
        const popupWindowModule = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        destroyPopupWindow = popupWindowModule.destroy;

        popupWindowModule.initializePopupWindow().then((popupWindow) => {
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

    async function promptForLogin(
        submitCallback: (
            email: string,
            password: string,
            closeWindow: () => void,
            showWarning: (message: string | Node[]) => void,
        ) => void,
        message?: string | Node[]
    ) {
        const popupWindowModule = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        destroyPopupWindow = popupWindowModule.destroy;

        popupWindowModule.initializePopupWindow().then((popupWindow) => {
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
                    popupWindow.hide,
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
                popupWindow.hide();
            });

            popupWindow.show(promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox);
            emailInput.focus();
        });
    }

    async function promptForTotpSetup(totpInfo: TOTPInfo.TOTPInfo) {
        const popupWindowModule = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        destroyPopupWindow = popupWindowModule.destroy;

        popupWindowModule.initializePopupWindow().then((popupWindow) => {
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

                sendServerRequest(redirect, 'set_totp', {
                    callback: (response: string) => {
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
                            currentMfaStatus = true;
                            changeMfaStatus();
                            disableAllInputs(false);
                        } else {
                            let parsedResponse: RecoveryCodeInfo.RecoveryCodeInfo;
                            try {
                                parsedResponse = JSON.parse(response);
                                RecoveryCodeInfo.check(parsedResponse);
                            } catch (e) {
                                showMessage(redirect, invalidResponse());
                                return;
                            }
                            showRecoveryCode(parsedResponse, () => {
                                changeColor(mfaWarning, 'green');
                                replaceText(mfaWarning, mfaEnabled);
                                showElement(mfaWarning);
                                currentMfaStatus = true;
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
        const popupWindowModule = await popupWindowImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        destroyPopupWindow = popupWindowModule.destroy;

        popupWindowModule.initializePopupWindow().then((popupWindow) => {
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

    function changeMfaStatus() {
        const disableButtonText = '無効にする';
        const loginNotificationEnabledPrefix = 'ログイン通知が有効になっています。';
        if (currentMfaStatus) {
            replaceText(mfaInfo, '二要素認証が有効になっています。');
            replaceText(mfaButton, disableButtonText);

            hideElement(recoveryCodeInfo);
            recoveryCodeButton.disabled = false;
            removeClass(recoveryCodeButton, 'not-allowed');

            replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationEnabledPrefix : 'ログイン通知が無効になっています。');
            replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : '有効にする');
            loginNotificationButton.disabled = false;
            removeClass(loginNotificationButton, 'not-allowed');
        } else {
            replaceText(mfaInfo, mfaNotSet);
            replaceText(mfaButton, '設定する');

            replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
            changeColor(recoveryCodeInfo, null);
            showElement(recoveryCodeInfo);
            hideElement(recoveryCodeWarning);
            recoveryCodeButton.disabled = true;
            addClass(recoveryCodeButton, 'not-allowed');

            replaceText(loginNotificationInfo, loginNotificationEnabledPrefix + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
            replaceText(loginNotificationButton, disableButtonText);
            hideElement(loginNotificationWarning);
            loginNotificationButton.disabled = true;
            addClass(loginNotificationButton, 'not-allowed');
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

        recoveryCodeButton.disabled = disabled || !currentMfaStatus;
        loginNotificationButton.disabled = disabled || !currentMfaStatus;
    }
}

function serverResponseCallback(response: string, failedCallback: (message: string | Node[]) => void, failedTotpCallback: () => void, successCallback: () => void) {
    const authenticationResult = handleAuthenticationResult(
        response,
        () => { failedCallback(loginFailed); },
        failedTotpCallback,
        () => { failedCallback([...accountDeactivated()]); },
        () => { failedCallback(tooManyFailedLogin); },
    );
    if (!authenticationResult) {
        return;
    }
    successCallback();
}

function appendParagraph(text: string, container: HTMLElement) {
    const elem = createParagraphElement();
    appendText(elem, text);
    appendChild(container, elem);
}

export function offload() {
    destroyPopupWindow?.();
}