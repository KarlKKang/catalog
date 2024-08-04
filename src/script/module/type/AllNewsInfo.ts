import { parseNumber, parseObject, parseString, parseTypedArray } from './helper';

export const enum AllNewsInfoEntryKey {
    ID,
    TITLE,
    UPDATE_TIME,
}
type AllNewsInfoEntry = {
    readonly [AllNewsInfoEntryKey.ID]: string;
    readonly [AllNewsInfoEntryKey.TITLE]: string;
    readonly [AllNewsInfoEntryKey.UPDATE_TIME]: number;
};

export type AllNewsInfoEntries = readonly AllNewsInfoEntry[];
export type Pivot = 'EOF' | number;
export const enum AllNewsInfoKey {
    NEWS,
    PIVOT,
}
export type AllNewsInfo = {
    readonly [AllNewsInfoKey.NEWS]: AllNewsInfoEntries;
    readonly [AllNewsInfoKey.PIVOT]: Pivot;
};

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
