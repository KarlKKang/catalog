import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    addNavBar,
    passwordStyling,
    sendServerRequest,
    changeColor,
    logout,
    NAV_BAR_MY_ACCOUNT,
} from '../module/common';
import {
    addEventListener,
    showElement,
    appendText,
    clearSessionStorage,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import * as AccountInfo from '../module/type/AccountInfo';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { redirect } from '../module/global';
import { SHARED_VAR_IDX_CURRENT_MFA_STATUS, SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, SHARED_VAR_IDX_INVITE_BUTTON, SHARED_VAR_IDX_INVITE_COUNT, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGOUT_BUTTON, SHARED_VAR_IDX_MFA_BUTTON, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON, dereferenceSharedVars, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars } from './shared_var';
import { changeMfaStatus, disableAllInputs } from './helper';
import { changeEmail, changePassword, changeUsername, invite, showSessions } from './basic';
import { changeLoginNotification, disableMfa, enableMfa, generateRecoveryCode } from './mfa';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    sendServerRequest('get_account', {
        callback: function (response: string) {
            let parsedResponse: AccountInfo.AccountInfo;
            try {
                parsedResponse = JSON.parse(response);
                AccountInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            showPage(() => { showPageCallback(parsedResponse); });
        }
    });
}

function showPageCallback(userInfo: AccountInfo.AccountInfo) {
    initializeSharedVars(userInfo);

    addEventListener(getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON), 'click', changeEmail);
    addEventListener(getSharedButton(SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON), 'click', () => { changeUsername(userInfo); });
    addEventListener(getSharedButton(SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON), 'click', changePassword);
    addEventListener(getSharedButton(SHARED_VAR_IDX_MFA_BUTTON), 'click', () => {
        if (getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS)) {
            disableMfa();
        } else {
            enableMfa();
        }
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON), 'click', generateRecoveryCode);
    addEventListener(getSharedButton(SHARED_VAR_IDX_INVITE_BUTTON), 'click', invite);
    addEventListener(getSharedButton(SHARED_VAR_IDX_LOGOUT_BUTTON), 'click', () => {
        disableAllInputs(true);
        logout(() => {
            redirect(LOGIN_URL);
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON), 'click', changeLoginNotification);

    passwordStyling(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT));
    passwordStyling(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT));

    changeMfaStatus();
    if (getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS)) {
        const recoveryCodeInfo = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO);
        if (userInfo.recovery_code_status === 0) {
            changeColor(recoveryCodeInfo, 'red');
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo.recovery_code_status === 1) {
            changeColor(recoveryCodeInfo, 'orange');
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SHARED_VAR_IDX_INVITE_COUNT), userInfo.invite_quota.toString());
    getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT).value = userInfo.username;
    showSessions(userInfo);
    addNavBar(NAV_BAR_MY_ACCOUNT);
}

export function offload() {
    dereferenceSharedVars();
}