import { throwError, isObject, isString, isArray, isNumber } from './helper';

type AllNewsInfoEntry = {
    id: string,
    title: string,
    update_time: number
}

export type AllNewsInfoEntries = AllNewsInfoEntry[];

export type OffsetInfo = number | 'EOF';

export type AllNewsInfo = [
    ...AllNewsInfoEntry[],
    OffsetInfo
];

export function check(allNewsInfo: any) {
    if (!isArray(allNewsInfo)) {
        throwError();
    }

    if (allNewsInfo.length < 1) {
        throwError();
    }

    var offsetInfo = allNewsInfo[allNewsInfo.length - 1];

    if (!isNumber(offsetInfo) && offsetInfo !== "EOF") {
        throwError();
    }

    if (allNewsInfo.length == 1 && offsetInfo !== "EOF") {
        throwError();
    }

    var allNewsInfoEntries: any[] = allNewsInfo.slice(0, -1);
    for (let allNewsInfoEntry of allNewsInfoEntries) {
        if (!isObject(allNewsInfoEntry)) {
            throwError();
        }
        if (!isNumber(allNewsInfoEntry.update_time) || !isString(allNewsInfoEntry.title) || !isString(allNewsInfoEntry.id)) {
            throwError();
        }
    }
}