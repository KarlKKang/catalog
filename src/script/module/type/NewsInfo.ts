import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseString } from './internal/parse_string';
import { parseOptional } from './internal/parse_optional';

export const enum NewsInfoKey {
    TITLE,
    CREATE_TIME,
    UPDATE_TIME,
    CREDENTIAL,
}
export interface NewsInfo {
    readonly [NewsInfoKey.TITLE]: string;
    readonly [NewsInfoKey.CREATE_TIME]: number;
    readonly [NewsInfoKey.UPDATE_TIME]: number | undefined;
    readonly [NewsInfoKey.CREDENTIAL]: string;
}

export function parseNewsInfo(newsInfo: unknown): NewsInfo {
    const newsInfoObj = parseObject(newsInfo);
    return {
        [NewsInfoKey.TITLE]: parseString(newsInfoObj.title),
        [NewsInfoKey.CREATE_TIME]: parseNumber(newsInfoObj.create_time),
        [NewsInfoKey.UPDATE_TIME]: parseOptional(newsInfoObj.update_time, parseNumber),
        [NewsInfoKey.CREDENTIAL]: parseString(newsInfoObj.credential),
    };
}
