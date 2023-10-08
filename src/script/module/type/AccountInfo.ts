import { throwError, isObject, isNumber, isBoolean, isString, isArray } from './helper';

export interface AccountInfo {
    username: string;
    invite_quota: number;
    mfa_status: boolean;
    recovery_code_status: number;
    login_notification: boolean;
    sessions: {
        id?: string;
        ua: string;
        ip: string;
        country: string;
        last_active_time: number;
        login_time: number;
    }[];
}

export function check(accountInfo: any) {
    if (!isObject(accountInfo)) {
        throwError();
    }

    if (!isString(accountInfo.username) || !isNumber(accountInfo.invite_quota) || !isBoolean(accountInfo.mfa_status) || !isNumber(accountInfo.recovery_code_status) || !isBoolean(accountInfo.login_notification)) {
        throwError();
    }

    if (!isArray(accountInfo.sessions)) {
        throwError();
    }

    for (const session of accountInfo.sessions) {
        if (!isObject(session)) {
            throwError();
        }

        if (!isString(session.ua) || !isString(session.ip) || !isString(session.country) || !isNumber(session.last_active_time) || !isNumber(session.login_time)) {
            throwError();
        }

        if (session.id !== undefined && !isString(session.id)) {
            throwError();
        }
    }
}