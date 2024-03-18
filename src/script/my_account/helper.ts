import { addClass, disableInput, removeClass, replaceText } from '../module/dom';
import { disableButtonText, enableButtonText, loginNotificationIsDisabled, loginNotificationIsEnabled, mfaNotSet } from '../module/message/template/inline';
import { changeColor, hideElement, showElement } from '../module/style';
import { SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS, SHARED_VAR_IDX_CURRENT_MFA_STATUS, SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, SHARED_VAR_IDX_INVITE_BUTTON, SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO, SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, SHARED_VAR_IDX_LOGOUT_BUTTON, SHARED_VAR_IDX_MFA_BUTTON, SHARED_VAR_IDX_MFA_INFO, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_RECOVERY_CODE_WARNING, SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON, getSharedBool, getSharedButton, getSharedElement, getSharedInput, sessionLogoutButtons, setCurrentLoginNotificationStatus, setCurrentMfaStatus } from './shared_var';

export function changeMfaStatus(newStatus: boolean) {
    setCurrentMfaStatus(newStatus);
    const mfaInfo = getSharedElement(SHARED_VAR_IDX_MFA_INFO);
    const mfaButton = getSharedButton(SHARED_VAR_IDX_MFA_BUTTON);
    const recoveryCodeInfo = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO);
    const recoveryCodeButton = getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON);
    const loginNotificationInfo = getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO);
    const loginNotificationButton = getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON);
    if (newStatus) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, disableButtonText);

        hideElement(recoveryCodeInfo);
        recoveryCodeButton.disabled = false;
        removeClass(recoveryCodeButton, 'not-allowed');

        const currentLoginNotificationStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS);
        replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationIsEnabled : loginNotificationIsDisabled);
        replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : enableButtonText);
        loginNotificationButton.disabled = false;
        removeClass(loginNotificationButton, 'not-allowed');
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');

        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_WARNING));
        recoveryCodeButton.disabled = true;
        addClass(recoveryCodeButton, 'not-allowed');

        setCurrentLoginNotificationStatus(true);
        replaceText(loginNotificationInfo, loginNotificationIsEnabled + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING));
        loginNotificationButton.disabled = true;
        addClass(loginNotificationButton, 'not-allowed');
    }
}

export function disableAllInputs(disabled: boolean) {
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT), disabled);

    getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_MFA_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_INVITE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_LOGOUT_BUTTON).disabled = disabled;

    const currentMfaStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS);
    getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON).disabled = disabled || !currentMfaStatus;
    getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON).disabled = disabled || !currentMfaStatus;

    for (const sessionLogoutButton of sessionLogoutButtons) {
        sessionLogoutButton.disabled = disabled;
    }
}