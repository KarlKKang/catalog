import { replaceText } from '../module/dom/create_element';
import { disableButton, disableInput } from '../module/dom/change_input';
import { changeColor, hideElement, setCursor, showElement } from '../module/style';
import { CSS_CURSOR } from '../module/style/value';
import { SharedBool, SharedButton, SharedInput, SharedElement, getSharedBool, getSharedButton, getSharedElement, getSharedInput, sessionLogoutButtons, setSharedBool } from './shared_var';

export const mfaNotSet = '二要素認証が設定されていません。';

export function updateMfaUI(newStatus: boolean) {
    setSharedBool(SharedBool.currentMfaStatus, newStatus);
    const mfaInfo = getSharedElement(SharedElement.mfaInfo);
    const mfaButton = getSharedButton(SharedButton.mfaButton);
    const recoveryCodeInfo = getSharedElement(SharedElement.recoveryCodeInfo);
    const recoveryCodeButton = getSharedButton(SharedButton.recoveryCodeButton);
    const loginNotificationInfo = getSharedElement(SharedElement.loginNotificationInfo);
    const loginNotificationButton = getSharedButton(SharedButton.loginNotificationButton);
    const disableButtonText = '無効にする';
    const loginNotificationIsEnabled = 'ログイン通知が有効になっています。';
    if (newStatus) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, disableButtonText);

        hideElement(recoveryCodeInfo);
        disableButton(recoveryCodeButton, false);
        setCursor(recoveryCodeButton, null);

        const currentLoginNotificationStatus = getSharedBool(SharedBool.currentLoginNotificationStatus);
        replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationIsEnabled : 'ログイン通知が無効になっています。');
        replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : '有効にする');
        disableButton(loginNotificationButton, false);
        setCursor(loginNotificationButton, null);
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');

        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(getSharedElement(SharedElement.recoveryCodeWarning));
        disableButton(recoveryCodeButton, true);
        setCursor(recoveryCodeButton, CSS_CURSOR.NOT_ALLOWED);

        setSharedBool(SharedBool.currentLoginNotificationStatus, true);
        replaceText(loginNotificationInfo, loginNotificationIsEnabled + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SharedElement.loginNotificationWarning));
        disableButton(loginNotificationButton, true);
        setCursor(loginNotificationButton, CSS_CURSOR.NOT_ALLOWED);
    }
}

export function disableAllInputs(disabled: boolean) {
    disableInput(getSharedInput(SharedInput.newUsernameInput), disabled);
    disableInput(getSharedInput(SharedInput.newPasswordInput), disabled);
    disableInput(getSharedInput(SharedInput.newPasswordComfirmInput), disabled);
    disableInput(getSharedInput(SharedInput.inviteReceiverEmailInput), disabled);

    disableButton(getSharedButton(SharedButton.emailChangeButton), disabled);
    disableButton(getSharedButton(SharedButton.usernameChangeButton), disabled);
    disableButton(getSharedButton(SharedButton.passwordChangeButton), disabled);
    disableButton(getSharedButton(SharedButton.mfaButton), disabled);
    disableButton(getSharedButton(SharedButton.inviteButton), disabled);
    disableButton(getSharedButton(SharedButton.logoutButton), disabled);

    const currentMfaStatus = getSharedBool(SharedBool.currentMfaStatus);
    disableButton(getSharedButton(SharedButton.recoveryCodeButton), disabled || !currentMfaStatus);
    disableButton(getSharedButton(SharedButton.loginNotificationButton), disabled || !currentMfaStatus);

    for (const sessionLogoutButton of sessionLogoutButtons) {
        disableButton(sessionLogoutButton, disabled);
    }
}
