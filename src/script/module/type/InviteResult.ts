import { throwError, isObject, isNumber, isBoolean } from './helper';
export type InviteResult = {
    special?: boolean;
    quota: number;
};

export function check(inviteResult: any) {
    if (!isObject(inviteResult)) {
        throwError();
    }

    if (!isNumber(inviteResult.quota)) {
        throwError();
    }

    if (inviteResult.special !== undefined && !isBoolean(inviteResult.special)) {
        throwError();
    }
}
