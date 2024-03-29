import { throwError, isObject, isArray, isNumber, isString } from './helper';
import * as MaintenanceInfo from './MaintenanceInfo';

export interface SeriesEntry {
    title: string;
    thumbnail: string;
    id: string;
}

export type Series = SeriesEntry[];

export type Pivot = 'EOF' | number;

export type SeriesInfo = {
    series: Series;
    pivot: Pivot;
    maintenance?: MaintenanceInfo.MaintenanceInfo;
};

export function check(seriesInfo: any) {
    if (!isObject(seriesInfo)) {
        throwError();
    }

    const series = seriesInfo.series;
    if (!isArray(series)) {
        throwError();
    }
    for (const seriesEntry of series) {
        if (!isObject(seriesEntry)) {
            throwError();
        }
        if (!isString(seriesEntry.title) || !isString(seriesEntry.thumbnail) || !isString(seriesEntry.id)) {
            throwError();
        }
    }

    const pivot = seriesInfo.pivot;
    if (!isNumber(pivot) && pivot !== 'EOF') {
        throwError();
    }

    if (seriesInfo.maintenance !== undefined) {
        MaintenanceInfo.check(seriesInfo.maintenance);
    }
}


