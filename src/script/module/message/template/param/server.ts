import { paramWithRedirect } from './helper';
import * as body from '../body/server';
import * as title from '../title/server';
import { TOP_URL } from '../../../env/constant';
import { MaintenanceInfo } from '../../../type/MaintenanceInfo';

export const invalidResponse = paramWithRedirect(body.invalidResponse);
export const sessionEnded = {
    title: title.sessionEnded,
    message: body.sessionEnded,
    color: 'orange',
    url: TOP_URL
};
export const connectionError = {
    title: title.connectionError,
    message: body.connectionError
};
export const status429 = {
    title: title.status429,
    message: body.status429
};
export const status503 = function (maintenanceInfo: MaintenanceInfo) {
    return {
        title: title.status503,
        message: body.status503(maintenanceInfo),
        color: 'orange'
    };
};
export const status400And500 = function (responseText: string) {
    return {
        message: body.status400And500(responseText)
    };
};
export const status403 = {
    message: body.status403
};