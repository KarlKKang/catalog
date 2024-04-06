import { parseString, parseTypedArray } from './helper';

export type RecoveryCodeInfo = readonly string[];

export function parseRecoveryCodeInfo(recoveryCodeInfo: unknown): RecoveryCodeInfo {
    return parseTypedArray(recoveryCodeInfo, parseString);
}