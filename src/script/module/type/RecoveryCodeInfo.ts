import { parseTypedArray } from './internal/parse_array/typed';
import { parseString } from './internal/parse_string';

export type RecoveryCodeInfo = readonly string[];

export function parseRecoveryCodeInfo(recoveryCodeInfo: unknown): RecoveryCodeInfo {
    return parseTypedArray(recoveryCodeInfo, parseString);
}
