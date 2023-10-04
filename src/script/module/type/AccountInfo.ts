import { throwError, isObject, isNumber, isBoolean, isString, isArray } from './helper';

export interface AccountInfo {
    username: string;
    invite_quota: number;
    mfa_status: boolean;
    recovery_code_status: number;
    sessions: {
        ua: string;
        ip: string;
        country: string;
        time: number;
        current?: boolean;
    }[];
}

export function check(accountInfo: any) {
    if (!isObject(accountInfo)) {
        throwError();
    }

    if (!isString(accountInfo.username) || !isNumber(accountInfo.invite_quota) || !isBoolean(accountInfo.mfa_status) || !isNumber(accountInfo.recovery_code_status)) {
        throwError();
    }

    if (!isArray(accountInfo.sessions)) {
        throwError();
    }

    for (const session of accountInfo.sessions) {
        if (!isObject(session)) {
            throwError();
        }

        if (!isString(session.ua) || !isString(session.ip) || !isString(session.country) || !isNumber(session.time)) {
            throwError();
        }

        if (session.current !== undefined && !isBoolean(session.current)) {
            throwError();
        }
    }
}