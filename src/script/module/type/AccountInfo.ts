import { throwError, isObject, isNumber, isBoolean, isString } from './helper';

export interface AccountInfo {
    username: string;
    invite_quota: number;
    mfa_status: boolean;
    recovery_code_status: number;
    login_notification: boolean;
}

export function check(accountInfo: any) {
    if (!isObject(accountInfo)) {
        throwError();
    }

    if (!isString(accountInfo.username) || !isNumber(accountInfo.invite_quota) || !isBoolean(accountInfo.mfa_status) || !isNumber(accountInfo.recovery_code_status) || !isBoolean(accountInfo.login_notification)) {
        throwError();
    }
}