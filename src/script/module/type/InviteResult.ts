import { parseBoolean, parseNumber, parseObject } from './helper';
export type InviteResult = {
    readonly special: boolean | undefined;
    readonly quota: number;
};

export function parseInviteResult(inviteResult: unknown): InviteResult {
    const inviteResultObj = parseObject(inviteResult);
    const special = inviteResultObj.special;
    return {
        special: special === undefined ? undefined : parseBoolean(special),
        quota: parseNumber(inviteResultObj.quota),
    };
}
