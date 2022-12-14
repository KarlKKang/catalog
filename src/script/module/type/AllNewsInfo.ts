import { throwError, isObject, isString, isArray, isNumber } from './helper';

type AllNewsInfoEntry = {
    id: string;
    title: string;
    update_time: number;
};

export type AllNewsInfoEntries = AllNewsInfoEntry[];

export type PivotInfo = number | 'EOF';

export type AllNewsInfo = [
    ...AllNewsInfoEntries,
    PivotInfo
];

export function check(allNewsInfo: any) {
    if (!isArray(allNewsInfo)) {
        throwError();
    }

    if (allNewsInfo.length < 1) {
        throwError();
    }

    const pivotInfo = allNewsInfo[allNewsInfo.length - 1];

    if (!isNumber(pivotInfo) && pivotInfo !== 'EOF') {
        throwError();
    }

    const allNewsInfoEntries = allNewsInfo.slice(0, -1);
    for (const allNewsInfoEntry of allNewsInfoEntries) {
        if (!isObject(allNewsInfoEntry)) {
            throwError();
        }
        if (!isNumber(allNewsInfoEntry.update_time) || !isString(allNewsInfoEntry.title) || !isString(allNewsInfoEntry.id)) {
            throwError();
        }
    }
}