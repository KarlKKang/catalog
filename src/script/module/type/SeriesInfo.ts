import { parseNumber, parseObject, parseOptional, parseString, parseTypedArray } from './helper';
import { parseMaintenanceInfo, type MaintenanceInfo } from './MaintenanceInfo';

export interface SeriesEntry {
    readonly title: string;
    readonly thumbnail: string;
    readonly id: string;
}
export type Series = readonly SeriesEntry[];
export type Pivot = 'EOF' | number;
export type SeriesInfo = {
    readonly series: Series;
    readonly pivot: Pivot;
    readonly maintenance: MaintenanceInfo | undefined;
};

export function parseSeriesInfo(seriesInfo: unknown): SeriesInfo {
    const seriesInfoObj = parseObject(seriesInfo);
    const series = parseTypedArray(seriesInfoObj.series, (seriesEntry): SeriesEntry => {
        const seriesEntryObj = parseObject(seriesEntry);
        return {
            title: parseString(seriesEntryObj.title),
            thumbnail: parseString(seriesEntryObj.thumbnail),
            id: parseString(seriesEntryObj.id),
        };
    });
    const pivot = seriesInfoObj.pivot;
    return {
        series: series,
        pivot: pivot === 'EOF' ? pivot : parseNumber(pivot),
        maintenance: parseOptional(seriesInfoObj.maintenance, parseMaintenanceInfo)
    };
}


