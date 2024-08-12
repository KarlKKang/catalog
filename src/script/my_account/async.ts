import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { logout } from '../module/server/logout';
import { parseResponse } from '../module/server/parse_response';
import { addEventListener } from '../module/event_listener';
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
import { SharedBool, SharedButton, SharedElement, SharedInput, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars, setSharedBool } from './shared_var';
import { updateMfaUI, disableAllInputs, mfaNotSet } from './helper';
import { reauthenticationPrompt } from './auth_helper';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../module/regex';
import { buildURLForm } from '../module/http_form';
import { AccountInfoKey, type AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/server/message';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { InviteResultKey, parseInviteResult } from '../module/type/InviteResult';
import { redirect } from '../module/global';
import { default as initializeMFAModule } from './mfa';
import { LOGIN_URI } from '../module/env/uri';

const emailSent = emailSendPrefix + '。' + emailSentSuffix;

export default function (userInfo: AccountInfo) {
    initializeUI(userInfo);
    addEventListener(getSharedButton(SharedButton.emailChangeButton), 'click', changeEmail);
    addEventListener(getSharedButton(SharedButton.usernameChangeButton), 'click', () => {
        changeUsername(userInfo);
    });
    addEventListener(getSharedButton(SharedButton.passwordChangeButton), 'click', changePassword);
    addEventListener(getSharedButton(SharedButton.inviteButton), 'click', invite);
    addEventListener(getSharedButton(SharedButton.loginNotificationButton), 'click', changeLoginNotification);
    addEventListener(getSharedButton(SharedButton.logoutButton), 'click', () => {
        disableAllInputs(true);
        logout(() => {
            redirect(LOGIN_URI);
        });
    });
    initializeMFAModule();
}

function initializeUI(userInfo: AccountInfo) {
    const container = initializeSharedVars();
    appendChild(body, container);

    setSharedBool(SharedBool.currentLoginNotificationStatus, userInfo[AccountInfoKey.LOGIN_NOTIFICATION]);
    updateMfaUI(userInfo[AccountInfoKey.MFA_STATUS]);

    if (userInfo[AccountInfoKey.MFA_STATUS]) {
        const recoveryCodeInfo = getSharedElement(SharedElement.recoveryCodeInfo);
        if (userInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 0) {
            changeColor(recoveryCodeInfo, CSS_COLOR.RED);
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 1) {
            changeColor(recoveryCodeInfo, CSS_COLOR.ORANGE);
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SharedElement.inviteCount), userInfo[AccountInfoKey.INVITE_QUOTA].toString());
    getSharedInput(SharedInput.newUsernameInput).value = userInfo[AccountInfoKey.USERNAME];
}

function changeEmail() {
    disableAllInputs(true);

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
            disableAllInputs(false);
        },
        [ServerRequestOptionKey.SHOW_SESSION_ENDED_MESSAGE]: true,
    });
}

function changePassword() {
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
        buildURLForm({ new: newPassword }),
    );
}

function changeUsername(userInfo: AccountInfo) {
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
        buildURLForm({ new: newUsername }),
    );
}

function invite() {
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
        buildURLForm({ receiver: receiver }),
    );
}

function changeLoginNotification() {
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
        buildURLForm({ p: loginNotificationTargetStatus ? 1 : 0 }),
        true,
    );
}
