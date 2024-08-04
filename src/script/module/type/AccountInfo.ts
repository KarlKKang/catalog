import { parseBoolean, parseNumber, parseObject, parseString } from './helper';

export const enum AccountInfoKey {
    USERNAME,
    INVITE_QUOTA,
    MFA_STATUS,
    RECOVERY_CODE_STATUS,
    LOGIN_NOTIFICATION,
}
export type AccountInfo = {
    [AccountInfoKey.USERNAME]: string;
    readonly [AccountInfoKey.INVITE_QUOTA]: number;
    readonly [AccountInfoKey.MFA_STATUS]: boolean;
    readonly [AccountInfoKey.RECOVERY_CODE_STATUS]: number;
    readonly [AccountInfoKey.LOGIN_NOTIFICATION]: boolean;
};

export function parseAccountInfo(accountInfo: unknown): AccountInfo {
    const accountInfoObj = parseObject(accountInfo);
    return {
        [AccountInfoKey.USERNAME]: parseString(accountInfoObj.username),
        [AccountInfoKey.INVITE_QUOTA]: parseNumber(accountInfoObj.invite_quota),
        [AccountInfoKey.MFA_STATUS]: parseBoolean(accountInfoObj.mfa_status),
        [AccountInfoKey.RECOVERY_CODE_STATUS]: parseNumber(accountInfoObj.recovery_code_status),
        [AccountInfoKey.LOGIN_NOTIFICATION]: parseBoolean(accountInfoObj.login_notification),
    };
}
