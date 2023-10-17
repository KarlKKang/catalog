import * as body from '../body/server';
import * as title from '../title/server';
import { LOGIN_URL, TOP_URL } from '../../../env/constant';
import { MaintenanceInfo } from '../../../type/MaintenanceInfo';
import { getBaseURL } from '../../../dom';
import { MessageParam } from '../comm';

export const invalidResponse = () => {
    const href = getBaseURL();
    const param: MessageParam = {
        message: body.invalidResponse,
    };
    if (href === TOP_URL) {
        param.url = LOGIN_URL;
        param.logout = true;
        return param;
    } else if (href === LOGIN_URL) {
        param.buttonText = null;
        return param;
    } else {
        param.url = TOP_URL;
        return param;
    }
};
export const sessionEnded = (url: string) => ({
    title: title.sessionEnded,
    message: body.sessionEnded,
    color: 'orange',
    url: url
});
export const mediaSessionEnded = {
    title: title.sessionEnded,
    message: body.mediaSessionEnded,
    color: 'orange',
    url: TOP_URL
};
export const connectionError = {
    title: title.connectionError,
    message: body.connectionError,
    replaceBody: true
};
export const status429 = {
    title: title.status429,
    message: body.status429
};
export const status503 = (maintenanceInfo: MaintenanceInfo) => ({
    title: title.status503,
    message: body.status503(maintenanceInfo),
    color: 'orange',
    buttonText: null
});
export const status400And500 = (responseText: string) => ({
    message: body.status400And500(responseText)
});
export const notFound = {
    title: title.notFound,
    message: body.notFound,
    url: TOP_URL
};