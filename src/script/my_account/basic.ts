import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import {
    replaceText,
} from '../module/dom';
import { showMessage } from '../module/message';
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
import { SharedBool, SharedElement, SharedInput, getSharedBool, getSharedElement, getSharedInput, setSharedBool } from './shared_var';
import { updateMfaUI, disableAllInputs, mfaNotSet } from './helper';
import { reauthenticationPrompt } from './auth_helper';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import { AccountInfoKey, type AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/server/message';
import { changeColor, hideElement, showElement } from '../module/style';
import { CSS_COLOR } from '../module/style/value';
import { InviteResultKey, parseInviteResult } from '../module/type/InviteResult';

const emailSent = emailSendPrefix + '。' + emailSentSuffix;

export function changeEmail() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElement.emailWarning);

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    sendServerRequest('send_email_change', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'WAIT') {
                replaceText(warningElem, '直前までメールアドレスを変更していたため、30分ほど待ってから再度変更を試みてください。');
            } else if (response === 'DONE') {
                replaceText(warningElem, emailSent);
                changeColor(warningElem, CSS_COLOR.GREEN);
            } else {
                showMessage(invalidResponse());
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        },
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
    });
}

export function changePassword() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElement.passwordWarning);
    const newPasswordInput = getSharedInput(SharedInput.newPasswordInput);
    const newPasswordComfirmInput = getSharedInput(SharedInput.newPasswordComfirmInput);
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

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
                changeColor(warningElem, CSS_COLOR.GREEN);
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

    const warningElem = getSharedElement(SharedElement.usernameWarning);
    const newUsername = getSharedInput(SharedInput.newUsernameInput).value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    if (newUsername === '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername === userInfo[AccountInfoKey.USERNAME]) {
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
                changeColor(warningElem, CSS_COLOR.GREEN);
                userInfo[AccountInfoKey.USERNAME] = newUsername;
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
    const inviteWarning = getSharedElement(SharedElement.inviteWarning);
    const inviteReceiverEmailInput = getSharedInput(SharedInput.inviteReceiverEmailInput);
    const inviteCount = getSharedElement(SharedElement.inviteCount);

    const warningElem = inviteWarning;
    const receiver = inviteReceiverEmailInput.value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);
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
                const parsedResponse = parseResponse(response, parseInviteResult);
                replaceText(inviteCount, parsedResponse[InviteResultKey.QUOTA].toString());
                let message = emailSent;
                if (parsedResponse[InviteResultKey.SPECIAL]) {
                    message += '現在、一般登録を受け付けているため、招待券はかかりませんでした。';
                }
                replaceText(warningElem, message);
                changeColor(warningElem, CSS_COLOR.GREEN);
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'receiver=' + encodeURIComponent(receiver),
    );
}

export function changeLoginNotification() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElement.loginNotificationWarning);

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    const loginNotificationTargetStatus = !getSharedBool(SharedBool.currentLoginNotificationStatus);

    reauthenticationPrompt(
        'change_login_notification',
        (response: string) => {
            if (response === 'DONE') {
                setSharedBool(SharedBool.currentLoginNotificationStatus, loginNotificationTargetStatus);
                updateMfaUI(true);
                replaceText(warningElem, loginNotificationTargetStatus ? 'ログイン通知が有効になりました。' : 'ログイン通知が無効になりました。');
                changeColor(warningElem, CSS_COLOR.GREEN);
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