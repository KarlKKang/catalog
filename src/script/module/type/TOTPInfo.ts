import { parseObject } from './internal/parse_object';
import { parseString } from './internal/parse_string';

export const enum TOTPInfoKey {
    URI,
    P,
}
export interface TOTPInfo {
    readonly [TOTPInfoKey.URI]: string;
    readonly [TOTPInfoKey.P]: string;
}

export function parseTotpInfo(totpInfo: unknown): TOTPInfo {
    const totpInfoObj = parseObject(totpInfo);
    return {
        [TOTPInfoKey.URI]: parseString(totpInfoObj.uri),
        [TOTPInfoKey.P]: parseString(totpInfoObj.p),
    };
}
