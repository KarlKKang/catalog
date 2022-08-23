import { throwError, isObject, isString, isArray, isNumber } from './helper';

export interface SeriesEntry {
    title: string,
    thumbnail: string,
    id: string
}

export type SeriesEntries = SeriesEntry[];

export type OffsetInfo = "EOF" | number;

export type SeriesInfo = [...SeriesEntries, OffsetInfo];

export function check(seriesInfo: any) {
    if (!isArray(seriesInfo)) {
        throwError();
    }

    if (seriesInfo.length < 1) {
        throwError();
    }

    const offsetInfo = seriesInfo[seriesInfo.length - 1];

    if (!isNumber(offsetInfo) && offsetInfo !== "EOF") {
        throwError();
    }

    const seriesEntries = seriesInfo.slice(0, -1);
    for (const seriesEntry of seriesEntries) {
        if (!isObject(seriesEntry)) {
            throwError();
        }
        if (!isString(seriesEntry.title) || !isString(seriesEntry.thumbnail) || !isString(seriesEntry.id)) {
            throwError();
        }
    }
}