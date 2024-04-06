import { parseBoolean, parseNumber, parseObject, parseOptional } from './helper';
export type InviteResult = {
    readonly special: boolean | undefined;
    readonly quota: number;
};

export function parseInviteResult(inviteResult: unknown): InviteResult {
    const inviteResultObj = parseObject(inviteResult);
    return {
        special: parseOptional(inviteResultObj.special, parseBoolean),
        quota: parseNumber(inviteResultObj.quota),
    };
}
