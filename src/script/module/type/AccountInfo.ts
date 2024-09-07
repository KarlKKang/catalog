import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseBoolean } from './internal/parse_boolean';
import { parseString } from './internal/parse_string';

export const enum AccountInfoKey {
    ID,
    USERNAME,
    INVITE_QUOTA,
    MFA_STATUS,
    RECOVERY_CODE_STATUS,
    LOGIN_NOTIFICATION,
}
export interface AccountInfo {
    readonly [AccountInfoKey.ID]: number;
    [AccountInfoKey.USERNAME]: string;
    readonly [AccountInfoKey.INVITE_QUOTA]: number;
    [AccountInfoKey.MFA_STATUS]: boolean;
    readonly [AccountInfoKey.RECOVERY_CODE_STATUS]: number;
    [AccountInfoKey.LOGIN_NOTIFICATION]: boolean;
}

export function parseAccountInfo(accountInfo: unknown): AccountInfo {
    const accountInfoObj = parseObject(accountInfo);
    return {
        [AccountInfoKey.ID]: parseNumber(accountInfoObj.id),
        [AccountInfoKey.USERNAME]: parseString(accountInfoObj.username),
        [AccountInfoKey.INVITE_QUOTA]: parseNumber(accountInfoObj.invite_quota),
        [AccountInfoKey.MFA_STATUS]: parseBoolean(accountInfoObj.mfa_status),
        [AccountInfoKey.RECOVERY_CODE_STATUS]: parseNumber(accountInfoObj.recovery_code_status),
        [AccountInfoKey.LOGIN_NOTIFICATION]: parseBoolean(accountInfoObj.login_notification),
    };
}
