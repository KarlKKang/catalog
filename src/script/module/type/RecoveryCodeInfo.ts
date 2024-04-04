import { parseArray, parseString } from './helper';

export type RecoveryCodeInfo = readonly string[];

export function parseRecoveryCodeInfo(recoveryCodeInfo: unknown): RecoveryCodeInfo {
    const recoveryCodeInfoArr = parseArray(recoveryCodeInfo);
    const recoveryCodeInfoArrParsed: string[] = [];
    for (const recoveryCode of recoveryCodeInfoArr) {
        recoveryCodeInfoArrParsed.push(parseString(recoveryCode));
    }
    return recoveryCodeInfoArrParsed;
}