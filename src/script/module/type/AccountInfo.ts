import { parseBoolean, parseNumber, parseObject, parseString } from './helper';

export type AccountInfo = {
    username: string;
    readonly invite_quota: number;
    readonly mfa_status: boolean;
    readonly recovery_code_status: number;
    readonly login_notification: boolean;
};

export function parseAccountInfo(accountInfo: unknown): AccountInfo {
    const accountInfoObj = parseObject(accountInfo);
    return {
        username: parseString(accountInfoObj.username),
        invite_quota: parseNumber(accountInfoObj.invite_quota),
        mfa_status: parseBoolean(accountInfoObj.mfa_status),
        recovery_code_status: parseNumber(accountInfoObj.recovery_code_status),
        login_notification: parseBoolean(accountInfoObj.login_notification),
    };
}