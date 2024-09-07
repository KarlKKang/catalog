import { replaceText } from '../module/dom/element/text/replace';
import { disableButton } from '../module/dom/element/button/disable';
import { changeColor } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setCursor, CSS_CURSOR } from '../module/style/cursor';
import { SharedButton, SharedElement, getSharedButton, getSharedElement, getAccountInfo } from './shared_var';
import { AccountInfoKey } from '../module/type/AccountInfo';

export const mfaNotSet = '二要素認証が設定されていません。';

export function updateMfaUI(newStatus: boolean) {
    getAccountInfo()[AccountInfoKey.MFA_STATUS] = newStatus;
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

        const currentLoginNotificationStatus = getAccountInfo()[AccountInfoKey.LOGIN_NOTIFICATION];
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

        getAccountInfo()[AccountInfoKey.LOGIN_NOTIFICATION] = true;
        replaceText(loginNotificationInfo, loginNotificationIsEnabled + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SharedElement.loginNotificationWarning));
        disableButton(loginNotificationButton, true);
        setCursor(loginNotificationButton, CSS_CURSOR.NOT_ALLOWED);
    }
}
