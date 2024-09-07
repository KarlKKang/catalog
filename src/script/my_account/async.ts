import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { logout } from '../module/server/logout';
import { parseResponse } from '../module/server/parse_response';
import { addEventListener } from '../module/event_listener/add';
import { appendChild } from '../module/dom/node/append_child';
import { body } from '../module/dom/body';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { showMessage } from '../module/message';
import { invitationClosed } from '../module/text/invitation/closed';
import { passwordChanged } from '../module/text/password/changed';
import { passwordConfirmationMismatch } from '../module/text/password/mismatch';
import { invalidPasswordFormat } from '../module/text/password/invalid';
import { emailSentSuffix } from '../module/text/send_mail/suffix';
import { emailAlreadyRegistered } from '../module/text/email/already_registered';
import { invalidEmailFormat } from '../module/text/email/invalid';
import { usernameTaken } from '../module/text/username/taken';
import { usernameChanged } from '../module/text/username/changed';
import { usernameInvalid } from '../module/text/username/invalid';
import { usernameEmpty } from '../module/text/username/empty';
import { emailSentTitle as emailSendPrefix } from '../module/text/send_mail/title';
import { SharedButton, SharedElement, SharedInput, getAccountInfo, getSharedButton, getSharedElement, getSharedInput, getSharedInputField, initializeSharedVars } from './shared_var';
import { updateMfaUI, mfaNotSet } from './helper';
import { reauthenticationPrompt } from './auth_helper';
import { testPassword } from '../module/regex/password';
import { testEmail } from '../module/regex/email';
import { buildHttpForm } from '../module/string/http_form/build';
import { AccountInfoKey, type AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/message/param/invalid_response';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { InviteResultKey, parseInviteResult } from '../module/type/InviteResult';
import { redirect } from '../module/global/redirect';
import { default as initializeMFAModule } from './mfa';
import { LOGIN_URI } from '../module/env/uri';
import { disableButton } from '../module/dom/element/button/disable';
import { disableInputField } from '../module/dom/element/input/input_field/disable';

const emailSent = emailSendPrefix + '。' + emailSentSuffix;

export default function (accountInfo: AccountInfo) {
    initializeUI(accountInfo);
    addEventListener(getSharedButton(SharedButton.emailChangeButton), 'click', changeEmail);
    addEventListener(getSharedButton(SharedButton.usernameChangeButton), 'click', () => {
        changeUsername(accountInfo);
    });
    addEventListener(getSharedButton(SharedButton.passwordChangeButton), 'click', changePassword);
    addEventListener(getSharedButton(SharedButton.inviteButton), 'click', invite);
    addEventListener(getSharedButton(SharedButton.loginNotificationButton), 'click', () => {
        changeLoginNotification(accountInfo);
    });
    addEventListener(getSharedButton(SharedButton.logoutButton), 'click', () => {
        disableButton(getSharedButton(SharedButton.logoutButton), true);
        logout(() => {
            redirect(LOGIN_URI);
        });
    });
    initializeMFAModule(accountInfo);
}

function initializeUI(accountInfo: AccountInfo) {
    const container = initializeSharedVars(accountInfo);
    appendChild(body, container);
    updateMfaUI(accountInfo[AccountInfoKey.MFA_STATUS]);

    if (accountInfo[AccountInfoKey.MFA_STATUS]) {
        const recoveryCodeInfo = getSharedElement(SharedElement.recoveryCodeInfo);
        if (accountInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 0) {
            changeColor(recoveryCodeInfo, CSS_COLOR.RED);
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (accountInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 1) {
            changeColor(recoveryCodeInfo, CSS_COLOR.ORANGE);
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SharedElement.inviteCount), accountInfo[AccountInfoKey.INVITE_QUOTA].toString());
    getSharedInput(SharedInput.newUsernameInput).value = accountInfo[AccountInfoKey.USERNAME];
}

function changeEmail() {
    disableButton(getSharedButton(SharedButton.emailChangeButton), true);

    const warningElem = getSharedElement(SharedElement.emailWarning);

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    sendServerRequest('send_email_change', {
        [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
            disableButton(getSharedButton(SharedButton.emailChangeButton), false);
        },
        [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
    });
}

function changePassword() {
    const disableAllInputs = (disabled: boolean) => {
        disableInputField(getSharedInputField(SharedInput.newPasswordInput), disabled);
        disableInputField(getSharedInputField(SharedInput.newPasswordComfirmInput), disabled);
        disableButton(getSharedButton(SharedButton.passwordChangeButton), disabled);
    };
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElement.passwordWarning);
    const newPasswordInput = getSharedInput(SharedInput.newPasswordInput);
    const newPasswordComfirmInput = getSharedInput(SharedInput.newPasswordComfirmInput);
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    if (!testPassword(newPassword)) {
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
        disableAllInputs,
        warningElem,
        buildHttpForm({ new: newPassword }),
    );
}

function changeUsername(userInfo: AccountInfo) {
    const disableAllInputs = (disabled: boolean) => {
        disableInputField(getSharedInputField(SharedInput.newUsernameInput), disabled);
        disableButton(getSharedButton(SharedButton.usernameChangeButton), disabled);
    };
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
        disableAllInputs,
        warningElem,
        buildHttpForm({ new: newUsername }),
    );
}

function invite() {
    const disableAllInputs = (disabled: boolean) => {
        disableInputField(getSharedInputField(SharedInput.inviteReceiverEmailInput), disabled);
        disableButton(getSharedButton(SharedButton.inviteButton), disabled);
    };
    disableAllInputs(true);

    const inviteWarning = getSharedElement(SharedElement.inviteWarning);
    const inviteReceiverEmailInput = getSharedInput(SharedInput.inviteReceiverEmailInput);
    const inviteCount = getSharedElement(SharedElement.inviteCount);

    const warningElem = inviteWarning;
    const receiver = inviteReceiverEmailInput.value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);
    if (!testEmail(receiver)) {
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
        disableAllInputs,
        warningElem,
        buildHttpForm({ receiver: receiver }),
    );
}

function changeLoginNotification(accountInfo: AccountInfo) {
    const disableAllInputs = (disabled: boolean) => {
        disableButton(getSharedButton(SharedButton.loginNotificationButton), disabled || !getAccountInfo()[AccountInfoKey.MFA_STATUS]);
    };
    disableAllInputs(true);

    const warningElem = getSharedElement(SharedElement.loginNotificationWarning);

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    const loginNotificationTargetStatus = !accountInfo[AccountInfoKey.LOGIN_NOTIFICATION];

    reauthenticationPrompt(
        'change_login_notification',
        (response: string) => {
            if (response === 'DONE') {
                accountInfo[AccountInfoKey.LOGIN_NOTIFICATION] = loginNotificationTargetStatus;
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
        disableAllInputs,
        warningElem,
        buildHttpForm({ p: loginNotificationTargetStatus ? 1 : 0 }),
        true,
    );
}
