import { parseObject, parseString } from './helper';

export const enum TOTPInfoKey {
    URI,
    P,
}
export type TOTPInfo = {
    readonly [TOTPInfoKey.URI]: string;
    readonly [TOTPInfoKey.P]: string;
};

export function parseTotpInfo(totpInfo: unknown): TOTPInfo {
    const totpInfoObj = parseObject(totpInfo);
    return {
        [TOTPInfoKey.URI]: parseString(totpInfoObj.uri),
        [TOTPInfoKey.P]: parseString(totpInfoObj.p),
    };
}
