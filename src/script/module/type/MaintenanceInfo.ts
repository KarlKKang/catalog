import { parseNumber, parseObject } from './helper';

export const enum MaintenanceInfoKey {
    START,
    PERIOD,
}
export type MaintenanceInfo = {
    readonly [MaintenanceInfoKey.START]: number;
    readonly [MaintenanceInfoKey.PERIOD]: number;
};

export function parseMaintenanceInfo(maintenanceInfo: unknown): MaintenanceInfo {
    const maintenanceInfoObj = parseObject(maintenanceInfo);
    return {
        [MaintenanceInfoKey.START]: parseNumber(maintenanceInfoObj.start),
        [MaintenanceInfoKey.PERIOD]: parseNumber(maintenanceInfoObj.period),
    };
}


