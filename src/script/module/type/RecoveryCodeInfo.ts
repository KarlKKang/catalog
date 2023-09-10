import { isString } from '../main';
import { isArray, throwError } from './helper';

export type RecoveryCodeInfo = string[];

export function check(recoveryCodeInfo: any) {
    if (!isArray(recoveryCodeInfo)) {
        throwError();
    }

    for (const recoveryCode of recoveryCodeInfo) {
        if (!isString(recoveryCode)) {
            throwError();
        }
    }
}