import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { logout } from '../module/server/logout';
import { parseResponse } from '../module/server/parse_response';
import { addEventListener } from '../module/event_listener/add';
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
import { type MyAccountAllButtons, type MyAccountAllElements, type MyAccountAllInputFields, MyAccountButton, MyAccountElement, MyAccountInputField, initializeUI } from './initialize_ui';
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
import { type InputFieldElement, InputFieldElementKey } from '../module/dom/element/input/input_field/type';
import { importModule } from '../module/import_module';
import { parseSession } from '../module/type/Sessions';
import { pgid } from '../module/global/pgid';

const emailSent = emailSendPrefix + '。' + emailSentSuffix;

export default function (accountInfo: AccountInfo) {
    const [inputFields, buttons, elements] = initializeUI();
    setInitialUI(accountInfo, inputFields, buttons, elements);
    initializeSessions(accountInfo[AccountInfoKey.ID], elements[MyAccountElement.sessionsContainer]);
    addEventListener(buttons[MyAccountButton.emailChangeButton], 'click', () => {
        changeEmail(accountInfo[AccountInfoKey.ID], elements[MyAccountElement.emailWarning], buttons[MyAccountButton.emailChangeButton]);
    });
    addEventListener(buttons[MyAccountButton.usernameChangeButton], 'click', () => {
        changeUsername(accountInfo, elements[MyAccountElement.usernameWarning], inputFields[MyAccountInputField.newUsernameInputField], buttons[MyAccountButton.usernameChangeButton]);
    });
    addEventListener(buttons[MyAccountButton.passwordChangeButton], 'click', () => {
        changePassword(accountInfo[AccountInfoKey.ID], elements[MyAccountElement.passwordWarning], inputFields, buttons[MyAccountButton.passwordChangeButton]);
    });
    addEventListener(buttons[MyAccountButton.inviteButton], 'click', () => {
        invite(accountInfo[AccountInfoKey.ID], elements, inputFields[MyAccountInputField.inviteReceiverEmailInputField], buttons[MyAccountButton.inviteButton]);
    });
    addEventListener(buttons[MyAccountButton.loginNotificationButton], 'click', () => {
        changeLoginNotification(accountInfo, elements, buttons);
    });
    addEventListener(buttons[MyAccountButton.logoutButton], 'click', () => {
        disableButton(buttons[MyAccountButton.logoutButton], true);
        logout(() => {
            redirect(LOGIN_URI);
        }, accountInfo[AccountInfoKey.ID]);
    });
    initializeMFAModule(accountInfo, elements, buttons);
}

function setInitialUI(accountInfo: AccountInfo, inputFields: MyAccountAllInputFields, buttons: MyAccountAllButtons, elements: MyAccountAllElements) {
    updateMfaUI(accountInfo[AccountInfoKey.MFA_STATUS], accountInfo, elements, buttons);

    if (accountInfo[AccountInfoKey.MFA_STATUS]) {
        const recoveryCodeInfo = elements[MyAccountElement.recoveryCodeInfo];
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

    appendText(elements[MyAccountElement.inviteCount], accountInfo[AccountInfoKey.INVITE_QUOTA].toString());
    inputFields[MyAccountInputField.newUsernameInputField][InputFieldElementKey.INPUT].value = accountInfo[AccountInfoKey.USERNAME];
}

function changeEmail(accountID: string, warningElem: HTMLElement, emailChangeButton: HTMLButtonElement) {
    disableButton(emailChangeButton, true);

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
            disableButton(emailChangeButton, false);
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ id: accountID }),
        [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
    });
}

function changePassword(accountID: string, warningElem: HTMLElement, inputFields: MyAccountAllInputFields, passwordChangeButton: HTMLButtonElement) {
    const newPasswordInputField = inputFields[MyAccountInputField.newPasswordInputField];
    const newPasswordComfirmInputField = inputFields[MyAccountInputField.newPasswordComfirmInputField];

    const disableAllInputs = (disabled: boolean) => {
        disableInputField(newPasswordInputField, disabled);
        disableInputField(newPasswordComfirmInputField, disabled);
        disableButton(passwordChangeButton, disabled);
    };
    disableAllInputs(true);

    const newPasswordInput = newPasswordInputField[InputFieldElementKey.INPUT];
    const newPasswordComfirmInput = newPasswordComfirmInputField[InputFieldElementKey.INPUT];
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
        buildHttpForm({ id: accountID, new: newPassword }),
    );
}

function changeUsername(accountInfo: AccountInfo, warningElem: HTMLElement, newUsernameInputField: InputFieldElement, usernameChangeButton: HTMLButtonElement) {
    const disableAllInputs = (disabled: boolean) => {
        disableInputField(newUsernameInputField, disabled);
        disableButton(usernameChangeButton, disabled);
    };
    disableAllInputs(true);

    const newUsername = newUsernameInputField[InputFieldElementKey.INPUT].value;

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    if (newUsername === '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername === accountInfo[AccountInfoKey.USERNAME]) {
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
                accountInfo[AccountInfoKey.USERNAME] = newUsername;
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
        buildHttpForm({ id: accountInfo[AccountInfoKey.ID], new: newUsername }),
    );
}

function invite(accountID: string, elements: MyAccountAllElements, inviteReceiverEmailInputField: InputFieldElement, inviteButton: HTMLButtonElement) {
    const disableAllInputs = (disabled: boolean) => {
        disableInputField(inviteReceiverEmailInputField, disabled);
        disableButton(inviteButton, disabled);
    };
    disableAllInputs(true);

    const warningElem = elements[MyAccountElement.inviteWarning];
    const inviteCount = elements[MyAccountElement.inviteCount];
    const receiver = inviteReceiverEmailInputField[InputFieldElementKey.INPUT].value;

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
        buildHttpForm({ id: accountID, receiver: receiver }),
    );
}

function changeLoginNotification(accountInfo: AccountInfo, elements: MyAccountAllElements, buttons: MyAccountAllButtons) {
    const disableAllInputs = (disabled: boolean) => {
        disableButton(buttons[MyAccountButton.loginNotificationButton], disabled || !accountInfo[AccountInfoKey.MFA_STATUS]);
    };
    disableAllInputs(true);

    const warningElem = elements[MyAccountElement.loginNotificationWarning];

    hideElement(warningElem);
    changeColor(warningElem, CSS_COLOR.RED);

    const loginNotificationTargetStatus = !accountInfo[AccountInfoKey.LOGIN_NOTIFICATION];

    reauthenticationPrompt(
        'change_login_notification',
        (response: string) => {
            if (response === 'DONE') {
                accountInfo[AccountInfoKey.LOGIN_NOTIFICATION] = loginNotificationTargetStatus;
                updateMfaUI(true, accountInfo, elements, buttons);
                replaceText(warningElem, loginNotificationTargetStatus ? 'ログイン通知が有効になりました。' : 'ログイン通知が無効になりました。');
                changeColor(warningElem, CSS_COLOR.GREEN);
            } else if (response === 'TOTP NOT SET') {
                updateMfaUI(false, accountInfo, elements, buttons);
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
        buildHttpForm({ id: accountInfo[AccountInfoKey.ID], p: loginNotificationTargetStatus ? 1 : 0 }),
        true,
    );
}

function initializeSessions(accountID: string, sessionsContainer: HTMLElement) {
    const sessionsModuleImport = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './sessions',
        ),
    );
    const currentPgid = pgid;
    sendServerRequest('get_sessions', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            const sessionsModule = await sessionsModuleImport;
            if (currentPgid !== pgid) {
                return;
            }
            sessionsModule.default(parseResponse(response, parseSession), accountID, sessionsContainer);
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ id: accountID }),
    });
};
