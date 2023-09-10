import { isString } from '../main';
import { throwError, isObject, isNumber, isBoolean } from './helper';

export interface UserInfo {
    username: string;
    invite_quota: number;
    mfa_status: boolean;
    recovery_code_status: number;
}

export function check(userInfo: any) {
    if (!isObject(userInfo)) {
        throwError();
    }

    if (!isString(userInfo.username) || !isNumber(userInfo.invite_quota) || !isBoolean(userInfo.mfa_status) || !isNumber(userInfo.recovery_code_status)) {
        throwError();
    }
}