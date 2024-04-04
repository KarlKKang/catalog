import { parseArray, parseNumber, parseObject, parseString } from './helper';

type AllNewsInfoEntry = {
    readonly id: string;
    readonly title: string;
    readonly update_time: number;
};
export type AllNewsInfoEntries = readonly AllNewsInfoEntry[];
export type PivotInfo = number | 'EOF';
export type AllNewsInfo = readonly [
    ...AllNewsInfoEntries,
    PivotInfo
];

export function parseAllNewsInfo(allNewsInfo: unknown): AllNewsInfo {
    const allNewsInfoArr = parseArray(allNewsInfo);

    const allNewsInfoEntries = allNewsInfoArr.slice(0, -1);
    const allNewsInfoEntriesParsed: AllNewsInfoEntry[] = [];
    for (const allNewsInfoEntry of allNewsInfoEntries) {
        const allNewsInfoEntryObj = parseObject(allNewsInfoEntry);
        allNewsInfoEntriesParsed.push({
            id: parseString(allNewsInfoEntryObj.id),
            title: parseString(allNewsInfoEntryObj.title),
            update_time: parseNumber(allNewsInfoEntryObj.update_time),
        });
    }

    const pivotInfo = allNewsInfoArr[allNewsInfoArr.length - 1];
    return [...allNewsInfoEntriesParsed, pivotInfo === 'EOF' ? pivotInfo : parseNumber(pivotInfo)];
}