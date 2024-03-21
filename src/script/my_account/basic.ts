import { sendServerRequest } from '../module/server';
import {
    replaceText,
    remove,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import {
    invalidPasswordFormat,
    passwordConfirmationMismatch,
    passwordChanged,
    usernameChanged,
    usernameTaken,
    usernameEmpty,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    usernameInvalid,
    emailSentSuffix,
} from '../module/text/message/body';
import { emailSent as emailSendPrefix } from '../module/text/message/title';
import { SharedBoolVarsIdx, SharedElementVarsIdx, SharedInputVarsIdx, getSharedBool, getSharedElement, getSharedInput, sessionLogoutButtons, setSharedBool } from './shared_var';
import { updateMfaUI, disableAllInputs, mfaNotSet } from './helper';
import { reauthenticationPrompt } from './auth_helper';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import type { AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/server/message';
import * as InviteResult from '../module/type/InviteResult';
import { changeColor, hideElement, showElement } from '../module/style';

const emailSent = emailSendPrefix + '。' + emailSentSuffix;

export function changeEmail() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElementVarsIdx.emailWarning);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    sendServerRequest('send_email_change', {
        callback: function (response: string) {
            if (response === 'WAIT') {
                replaceText(warningElem, '直前までメールアドレスを変更していたため、30分ほど待ってから再度変更を試みてください。');
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

    const warningElem = getSharedElement(SharedElementVarsIdx.passwordWarning);
    const newPasswordInput = getSharedInput(SharedInputVarsIdx.newPasswordInput);
    const newPasswordComfirmInput = getSharedInput(SharedInputVarsIdx.newPasswordComfirmInput);
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

    const warningElem = getSharedElement(SharedElementVarsIdx.usernameWarning);
    const newUsername = getSharedInput(SharedInputVarsIdx.newUsernameInput).value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (newUsername === '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername === userInfo.username) {
        replaceText(warningElem, '新しいユーザー名は元のユーザー名と同じです。');
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
            } else if (response === 'INVALID') {
                replaceText(warningElem, usernameInvalid);
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
    const inviteWarning = getSharedElement(SharedElementVarsIdx.inviteWarning);
    const inviteReceiverEmailInput = getSharedInput(SharedInputVarsIdx.inviteReceiverEmailInput);
    const inviteCount = getSharedElement(SharedElementVarsIdx.inviteCount);

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
                replaceText(warningElem, '使える招待券が残っていません。');
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
                replaceText(sessionWarningElem, 'ログアウトしました。');
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

    const warningElem = getSharedElement(SharedElementVarsIdx.loginNotificationWarning);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    const loginNotificationTargetStatus = !getSharedBool(SharedBoolVarsIdx.currentLoginNotificationStatus);

    reauthenticationPrompt(
        'change_login_notification',
        (response: string) => {
            if (response === 'DONE') {
                setSharedBool(SharedBoolVarsIdx.currentLoginNotificationStatus, loginNotificationTargetStatus);
                updateMfaUI(true);
                replaceText(warningElem, loginNotificationTargetStatus ? 'ログイン通知が有効になりました。' : 'ログイン通知が無効になりました。');
                changeColor(warningElem, 'green');
            } else if (response === 'TOTP NOT SET') {
                updateMfaUI(false);
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