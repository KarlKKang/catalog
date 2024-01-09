import * as body from '../body/server';
import * as title from '../title/server';
import { LOGIN_URL, TOP_URL } from '../../../env/constant';
import type { MaintenanceInfo } from '../../../type/MaintenanceInfo';
import { getBaseURL } from '../../../dom';
import { reloadButtonText, type MessageParam } from '../comm';

export const invalidResponse = () => {
    const param: MessageParam = {
        message: body.invalidResponse,
    };
    setRedirectUrl(param);
    return param;
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
    replaceBody: true,
    url: TOP_URL // In case of request containing malicious string, the page needs to be reset to the top page.
};
export const status429 = {
    title: title.status429,
    message: body.status429
};
export const status503 = (maintenanceInfo: MaintenanceInfo) => ({
    title: title.status503,
    message: body.status503(maintenanceInfo),
    color: 'orange',
    buttonText: reloadButtonText
});
export const status400And500 = (responseText: string) => {
    const param = {
        message: body.status400And500(responseText),
        buttonText: reloadButtonText
    };
    setRedirectUrl(param);
    return param;
};
export const notFound = {
    title: title.notFound,
    message: body.notFound,
    url: TOP_URL
};
export const unknownServerError = () => {
    const param: MessageParam = {};
    setRedirectUrl(param);
    return param;
};

function setRedirectUrl(param: MessageParam) {
    const href = getBaseURL();
    if (href === TOP_URL) {
        param.url = LOGIN_URL;
        param.logout = true;
    } else if (href === LOGIN_URL) {
        param.url = LOGIN_URL; // This will strip away any query string that might cause the problem.
    } else {
        param.url = TOP_URL;
    }
}