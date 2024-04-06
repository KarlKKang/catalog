import { parseNumber, parseObject, parseOptional, parseString } from './helper';

export const enum NewsInfoKey {
    TITLE,
    CREATE_TIME,
    UPDATE_TIME,
    CREDENTIAL,
}
export type NewsInfo = {
    readonly [NewsInfoKey.TITLE]: string;
    readonly [NewsInfoKey.CREATE_TIME]: number;
    readonly [NewsInfoKey.UPDATE_TIME]: number | undefined;
    readonly [NewsInfoKey.CREDENTIAL]: string;
};

export function parseNewsInfo(newsInfo: unknown): NewsInfo {
    const newsInfoObj = parseObject(newsInfo);
    return {
        [NewsInfoKey.TITLE]: parseString(newsInfoObj.title),
        [NewsInfoKey.CREATE_TIME]: parseNumber(newsInfoObj.create_time),
        [NewsInfoKey.UPDATE_TIME]: parseOptional(newsInfoObj.update_time, parseNumber),
        [NewsInfoKey.CREDENTIAL]: parseString(newsInfoObj.credential),
    };
}