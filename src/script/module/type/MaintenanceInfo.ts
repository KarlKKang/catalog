import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';

export const enum MaintenanceInfoKey {
    START,
    PERIOD,
}
export interface MaintenanceInfo {
    readonly [MaintenanceInfoKey.START]: number;
    readonly [MaintenanceInfoKey.PERIOD]: number;
}

export function parseMaintenanceInfo(maintenanceInfo: unknown): MaintenanceInfo {
    const maintenanceInfoObj = parseObject(maintenanceInfo);
    return {
        [MaintenanceInfoKey.START]: parseNumber(maintenanceInfoObj.start),
        [MaintenanceInfoKey.PERIOD]: parseNumber(maintenanceInfoObj.period),
    };
}
