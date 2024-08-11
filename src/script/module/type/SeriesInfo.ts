import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseTypedArray } from './internal/parse_array/typed';
import { parseString } from './internal/parse_string';
import { parseOptional } from './internal/parse_optional';
import { parseMaintenanceInfo, type MaintenanceInfo } from './MaintenanceInfo';

export const enum SeriesEntryKey {
    TITLE,
    THUMBNAIL,
    ID,
}
export interface SeriesEntry {
    readonly [SeriesEntryKey.TITLE]: string;
    readonly [SeriesEntryKey.THUMBNAIL]: string;
    readonly [SeriesEntryKey.ID]: string;
}

export type Series = readonly SeriesEntry[];
export type Pivot = 'EOF' | number;
export const enum SeriesInfoKey {
    SERIES,
    PIVOT,
    MAINTENANCE,
}
export interface SeriesInfo {
    readonly [SeriesInfoKey.SERIES]: Series;
    readonly [SeriesInfoKey.PIVOT]: Pivot;
    readonly [SeriesInfoKey.MAINTENANCE]: MaintenanceInfo | undefined;
}

export function parseSeriesInfo(seriesInfo: unknown): SeriesInfo {
    const seriesInfoObj = parseObject(seriesInfo);
    const series = parseTypedArray(seriesInfoObj.series, (seriesEntry): SeriesEntry => {
        const seriesEntryObj = parseObject(seriesEntry);
        return {
            [SeriesEntryKey.TITLE]: parseString(seriesEntryObj.title),
            [SeriesEntryKey.THUMBNAIL]: parseString(seriesEntryObj.thumbnail),
            [SeriesEntryKey.ID]: parseString(seriesEntryObj.id),
        };
    });
    const pivot = seriesInfoObj.pivot;
    return {
        [SeriesInfoKey.SERIES]: series,
        [SeriesInfoKey.PIVOT]: pivot === 'EOF' ? pivot : parseNumber(pivot),
        [SeriesInfoKey.MAINTENANCE]: parseOptional(seriesInfoObj.maintenance, parseMaintenanceInfo),
    };
}
