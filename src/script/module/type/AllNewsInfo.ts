import { parseArray, parseNumber, parseObject, parseString, parseTypedArray } from './helper';

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
    const allNewsInfoEntries = parseTypedArray(allNewsInfoArr.slice(0, -1), (allNewsInfoEntry): AllNewsInfoEntry => {
        const allNewsInfoEntryObj = parseObject(allNewsInfoEntry);
        return {
            id: parseString(allNewsInfoEntryObj.id),
            title: parseString(allNewsInfoEntryObj.title),
            update_time: parseNumber(allNewsInfoEntryObj.update_time),
        };
    });
    const pivotInfo = allNewsInfoArr[allNewsInfoArr.length - 1];
    return [...allNewsInfoEntries, pivotInfo === 'EOF' ? pivotInfo : parseNumber(pivotInfo)];
}