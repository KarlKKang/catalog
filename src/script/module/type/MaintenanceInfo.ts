import { throwError, isObject, isNumber } from './helper';
export type MaintenanceInfo = {
    start: number;
    period: number;
};

export function check(maintenanceInfo: any) {
    if (!isObject(maintenanceInfo)) {
        throwError();
    }

    if (!isNumber(maintenanceInfo.start) || !isNumber(maintenanceInfo.period)) {
        throwError();
    }
}


