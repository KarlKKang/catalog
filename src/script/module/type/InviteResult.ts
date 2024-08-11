import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseBoolean } from './internal/parse_boolean';
import { parseOptional } from './internal/parse_optional';

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
