import { isObject, throwError, isString } from './helper';

export type TOTPInfo = {
    uri: string;
    p: string;
};

export function check(totpInfo: any) {
    if (!isObject(totpInfo)) {
        throwError();
    }

    if (!isString(totpInfo.uri) || !isString(totpInfo.p)) {
        throwError();
    }
}