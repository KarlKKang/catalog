import { isString } from '../main';
import { isObject, throwError } from './helper';

export type TOTPInfo = {
    uri: string;
    p: string;
    key_id: string;
    signature: string;
};

export function check(totpInfo: any) {
    if (!isObject(totpInfo)) {
        throwError();
    }

    if (!isString(totpInfo.uri) || !isString(totpInfo.p) || !isString(totpInfo.key_id) || !isString(totpInfo.signature)) {
        throwError();
    }
}