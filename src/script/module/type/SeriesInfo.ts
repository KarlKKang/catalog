import { parseArray, parseNumber, parseObject, parseString } from './helper';
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

    const series = parseArray(seriesInfoObj.series);
    const seriesParsed: SeriesEntry[] = [];
    for (const seriesEntry of series) {
        const seriesEntryObj = parseObject(seriesEntry);
        seriesParsed.push({
            title: parseString(seriesEntryObj.title),
            thumbnail: parseString(seriesEntryObj.thumbnail),
            id: parseString(seriesEntryObj.id),
        });
    }

    const pivot = seriesInfoObj.pivot;
    const maintenance = seriesInfoObj.maintenance;
    return {
        series: seriesParsed,
        pivot: pivot === 'EOF' ? pivot : parseNumber(pivot),
        maintenance: maintenance === undefined ? undefined : parseMaintenanceInfo(maintenance),
    };
}


