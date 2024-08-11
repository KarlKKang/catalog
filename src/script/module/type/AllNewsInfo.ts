import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseTypedArray } from './internal/parse_array/typed';
import { parseString } from './internal/parse_string';

export const enum AllNewsInfoEntryKey {
    ID,
    TITLE,
    UPDATE_TIME,
}
interface AllNewsInfoEntry {
    readonly [AllNewsInfoEntryKey.ID]: string;
    readonly [AllNewsInfoEntryKey.TITLE]: string;
    readonly [AllNewsInfoEntryKey.UPDATE_TIME]: number;
}

export type AllNewsInfoEntries = readonly AllNewsInfoEntry[];
export type Pivot = 'EOF' | number;
export const enum AllNewsInfoKey {
    NEWS,
    PIVOT,
}
export interface AllNewsInfo {
    readonly [AllNewsInfoKey.NEWS]: AllNewsInfoEntries;
    readonly [AllNewsInfoKey.PIVOT]: Pivot;
}

export function parseAllNewsInfo(allNewsInfo: unknown): AllNewsInfo {
    const allNewsInfoObj = parseObject(allNewsInfo);
    const news = parseTypedArray(allNewsInfoObj.news, (allNewsEntry): AllNewsInfoEntry => {
        const allNewsInfoEntryObj = parseObject(allNewsEntry);
        return {
            [AllNewsInfoEntryKey.ID]: parseString(allNewsInfoEntryObj.id),
            [AllNewsInfoEntryKey.TITLE]: parseString(allNewsInfoEntryObj.title),
            [AllNewsInfoEntryKey.UPDATE_TIME]: parseNumber(allNewsInfoEntryObj.update_time),
        };
    });
    const pivot = allNewsInfoObj.pivot;
    return {
        [AllNewsInfoKey.NEWS]: news,
        [AllNewsInfoKey.PIVOT]: pivot === 'EOF' ? pivot : parseNumber(pivot),
    };
}
