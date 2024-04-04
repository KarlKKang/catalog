import { parseObject, parseString } from './helper';

export type TOTPInfo = {
    readonly uri: string;
    readonly p: string;
};

export function parseTotpInfo(totpInfo: unknown): TOTPInfo {
    const totpInfoObj = parseObject(totpInfo);
    return {
        uri: parseString(totpInfoObj.uri),
        p: parseString(totpInfoObj.p),
    };
}