import { parseBoolean, parseNumber, parseObject, parseOptional } from './helper';

export const enum InviteResultKey {
    SPECIAL,
    QUOTA,
}
export interface InviteResult {
    readonly [InviteResultKey.SPECIAL]: boolean | undefined;
    readonly [InviteResultKey.QUOTA]: number;
}

export function parseInviteResult(inviteResult: unknown): InviteResult {
    const inviteResultObj = parseObject(inviteResult);
    return {
        [InviteResultKey.SPECIAL]: parseOptional(inviteResultObj.special, parseBoolean),
        [InviteResultKey.QUOTA]: parseNumber(inviteResultObj.quota),
    };
}
