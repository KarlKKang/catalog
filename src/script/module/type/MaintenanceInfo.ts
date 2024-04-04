import { parseNumber, parseObject } from './helper';
export type MaintenanceInfo = {
    readonly start: number;
    readonly period: number;
};

export function parseMaintenanceInfo(maintenanceInfo: unknown): MaintenanceInfo {
    const maintenanceInfoObj = parseObject(maintenanceInfo);
    return {
        start: parseNumber(maintenanceInfoObj.start),
        period: parseNumber(maintenanceInfoObj.period),
    };
}


