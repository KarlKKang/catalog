import {
    sendServerRequest,
    changeColor,
} from '../module/common';
import {
    showElement,
    hideElement,
    replaceText,
    remove,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import {
    emailSent,
    emailChangeWait,
    invalidPasswordFormat,
    passwordConfirmationMismatch,
    passwordChanged,
    usernameChanged,
    usernameTaken,
    usernameEmpty,
    usernameUnchanged,
    invitationNotQualified,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    logoutDone,
    loginNotificationIsEnabled,
    loginNotificationIsDisabled,
    disableButtonText,
    enableButtonText,
    loginNotificationDisabled,
    loginNotificationEnabled,
    mfaNotSet,
} from '../module/message/template/inline';
import { SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS, SHARED_VAR_IDX_EMAIL_WARNING, SHARED_VAR_IDX_INVITE_COUNT, SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT, SHARED_VAR_IDX_INVITE_WARNING, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO, SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_WARNING, SHARED_VAR_IDX_USERNAME_WARNING, getSharedBool, getSharedButton, getSharedElement, getSharedInput, sessionLogoutButtons, setCurrentLoginNotificationStatus } from './shared_var';
import { changeMfaStatus, disableAllInputs } from './helper';
import { reauthenticationPrompt } from './auth_helper';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import type { AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/message/template/param/server';
import * as InviteResult from '../module/type/InviteResult';

export function changeEmail() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_EMAIL_WARNING);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    sendServerRequest('send_email_change', {
        callback: function (response: string) {
            if (response === 'WAIT') {
                replaceText(warningElem, emailChangeWait);
            } else if (response === 'DONE') {
                replaceText(warningElem, emailSent);
                changeColor(warningElem, 'green');
            } else {
                showMessage(invalidResponse());
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        },
        showSessionEndedMessage: true,
    });
}

export function changePassword() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_PASSWORD_WARNING);
    const newPasswordInput = getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT);
    const newPasswordComfirmInput = getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT);
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (!PASSWORD_REGEX.test(newPassword)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newPassword !== newPasswordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        'change_password',
        (response: string) => {
            if (response === 'DONE') {
                replaceText(warningElem, passwordChanged);
                changeColor(warningElem, 'green');
                newPasswordInput.value = '';
                newPasswordComfirmInput.value = '';
            } else if (response === 'PASSWORD INVALID') {
                replaceText(warningElem, invalidPasswordFormat);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'new=' + encodeURIComponent(newPassword),
    );
}

export function changeUsername(userInfo: AccountInfo) {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_USERNAME_WARNING);
    const newUsername = getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT).value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (newUsername === '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername === userInfo.username) {
        replaceText(warningElem, usernameUnchanged);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        'change_username',
        (response: string) => {
            if (response === 'DONE') {
                replaceText(warningElem, usernameChanged);
                changeColor(warningElem, 'green');
                userInfo.username = newUsername;
            } else if (response === 'DUPLICATED') {
                replaceText(warningElem, usernameTaken);
            } else if (response === 'EMPTY') {
                replaceText(warningElem, usernameEmpty);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'new=' + encodeURIComponent(newUsername),
    );
}

export function invite() {
    disableAllInputs(true);
    const inviteWarning = getSharedElement(SHARED_VAR_IDX_INVITE_WARNING);
    const inviteReceiverEmailInput = getSharedInput(SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT);
    const inviteCount = getSharedElement(SHARED_VAR_IDX_INVITE_COUNT);

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
        'send_invite',
        (response: string) => {
            if (response === 'NOT QUALIFIED') {
                replaceText(inviteCount, '0');
                replaceText(warningElem, invitationNotQualified);
            } else if (response === 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
            } else if (response === 'ALREADY REGISTERED') {
                replaceText(warningElem, emailAlreadyRegistered);
            } else if (response === 'CLOSED') {
                replaceText(warningElem, invitationClosed);
            } else {
                let parsedResponse: InviteResult.InviteResult;
                try {
                    parsedResponse = JSON.parse(response);
                    InviteResult.check(parsedResponse);
                } catch (e) {
                    showMessage(invalidResponse());
                    return false;
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
            return true;
        },
        warningElem,
        'receiver=' + encodeURIComponent(receiver),
    );
}

export function logoutSession(sessionID: string, sessionLogoutButton: HTMLButtonElement, sessionWarningElem: HTMLDivElement) {
    disableAllInputs(true);
    hideElement(sessionWarningElem);
    changeColor(sessionWarningElem, 'red');
    reauthenticationPrompt(
        'logout_session',
        (response: string) => {
            if (response === 'DONE') {
                remove(sessionLogoutButton);
                sessionLogoutButtons.delete(sessionLogoutButton);
                changeColor(sessionWarningElem, 'green');
                replaceText(sessionWarningElem, logoutDone);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            showElement(sessionWarningElem);
            disableAllInputs(false);
            return true;
        },
        sessionWarningElem,
        'id=' + sessionID,
    );
}

export function changeLoginNotification() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    const loginNotificationTargetStatus = !getSharedBool(SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS);

    reauthenticationPrompt(
        'change_login_notification',
        (response: string) => {
            if (response === 'DONE') {
                setCurrentLoginNotificationStatus(loginNotificationTargetStatus);
                replaceText(getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO), loginNotificationTargetStatus ? loginNotificationIsEnabled : loginNotificationIsDisabled);
                replaceText(getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON), loginNotificationTargetStatus ? disableButtonText : enableButtonText);
                replaceText(warningElem, loginNotificationTargetStatus ? loginNotificationEnabled : loginNotificationDisabled);
                changeColor(warningElem, 'green');
            } else if (response === 'TOTP NOT SET') {
                changeMfaStatus(false);
                replaceText(warningElem, mfaNotSet);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'p=' + (loginNotificationTargetStatus ? '1' : '0'),
        true,
    );
}