import { addClass, disableInput, removeClass, replaceText } from '../module/dom';
import { changeColor, hideElement, showElement } from '../module/style';
import { SharedBoolVarsIdx, SharedButtonVarsIdx, SharedInputVarsIdx, SharedElementVarsIdx, getSharedBool, getSharedButton, getSharedElement, getSharedInput, sessionLogoutButtons, setSharedBool } from './shared_var';

export const mfaNotSet = '二要素認証が設定されていません。';

export function updateMfaUI(newStatus: boolean) {
    setSharedBool(SharedBoolVarsIdx.currentMfaStatus, newStatus);
    const mfaInfo = getSharedElement(SharedElementVarsIdx.mfaInfo);
    const mfaButton = getSharedButton(SharedButtonVarsIdx.mfaButton);
    const recoveryCodeInfo = getSharedElement(SharedElementVarsIdx.recoveryCodeInfo);
    const recoveryCodeButton = getSharedButton(SharedButtonVarsIdx.recoveryCodeButton);
    const loginNotificationInfo = getSharedElement(SharedElementVarsIdx.loginNotificationInfo);
    const loginNotificationButton = getSharedButton(SharedButtonVarsIdx.loginNotificationButton);
    const disableButtonText = '無効にする';
    const loginNotificationIsEnabled = 'ログイン通知が有効になっています。';
    if (newStatus) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, disableButtonText);

        hideElement(recoveryCodeInfo);
        recoveryCodeButton.disabled = false;
        removeClass(recoveryCodeButton, 'not-allowed');

        const currentLoginNotificationStatus = getSharedBool(SharedBoolVarsIdx.currentLoginNotificationStatus);
        replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationIsEnabled : 'ログイン通知が無効になっています。');
        replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : '有効にする');
        loginNotificationButton.disabled = false;
        removeClass(loginNotificationButton, 'not-allowed');
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');

        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(getSharedElement(SharedElementVarsIdx.recoveryCodeWarning));
        recoveryCodeButton.disabled = true;
        addClass(recoveryCodeButton, 'not-allowed');

        setSharedBool(SharedBoolVarsIdx.currentLoginNotificationStatus, true);
        replaceText(loginNotificationInfo, loginNotificationIsEnabled + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SharedElementVarsIdx.loginNotificationWarning));
        loginNotificationButton.disabled = true;
        addClass(loginNotificationButton, 'not-allowed');
    }
}

export function disableAllInputs(disabled: boolean) {
    disableInput(getSharedInput(SharedInputVarsIdx.newUsernameInput), disabled);
    disableInput(getSharedInput(SharedInputVarsIdx.newPasswordInput), disabled);
    disableInput(getSharedInput(SharedInputVarsIdx.newPasswordComfirmInput), disabled);
    disableInput(getSharedInput(SharedInputVarsIdx.inviteReceiverEmailInput), disabled);

    getSharedButton(SharedButtonVarsIdx.emailChangeButton).disabled = disabled;
    getSharedButton(SharedButtonVarsIdx.usernameChangeButton).disabled = disabled;
    getSharedButton(SharedButtonVarsIdx.passwordChangeButton).disabled = disabled;
    getSharedButton(SharedButtonVarsIdx.mfaButton).disabled = disabled;
    getSharedButton(SharedButtonVarsIdx.inviteButton).disabled = disabled;
    getSharedButton(SharedButtonVarsIdx.logoutButton).disabled = disabled;

    const currentMfaStatus = getSharedBool(SharedBoolVarsIdx.currentMfaStatus);
    getSharedButton(SharedButtonVarsIdx.recoveryCodeButton).disabled = disabled || !currentMfaStatus;
    getSharedButton(SharedButtonVarsIdx.loginNotificationButton).disabled = disabled || !currentMfaStatus;

    for (const sessionLogoutButton of sessionLogoutButtons) {
        sessionLogoutButton.disabled = disabled;
    }
}