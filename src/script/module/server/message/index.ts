import * as body from './body';
import * as title from './title';
import type { MaintenanceInfo } from '../../type/MaintenanceInfo';
import { getURI } from '../../dom/location';
import { MessageParamKey, type MessageParam } from '../../message/type';
import { CSS_COLOR } from '../../style/color';
import { LOGIN_URI, TOP_URI } from '../../env/uri';

const reloadButtonText = '再読み込み';
export const invalidResponse = () => {
    const param: MessageParam = {
        [MessageParamKey.MESSAGE]: body.invalidResponse,
    };
    setRedirectUrl(param);
    return param;
};
export const sessionEnded = (url: string) => ({
    [MessageParamKey.TITLE]: title.sessionEnded,
    [MessageParamKey.MESSAGE]: body.sessionEnded,
    [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamKey.URL]: url,
});
export const mediaSessionEnded = {
    [MessageParamKey.TITLE]: title.sessionEnded,
    [MessageParamKey.MESSAGE]: body.mediaSessionEnded,
    [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamKey.URL]: TOP_URI,
};
export const connectionError = {
    [MessageParamKey.TITLE]: title.connectionError,
    [MessageParamKey.MESSAGE]: body.connectionError,
    [MessageParamKey.REPLACE_BODY]: true,
    [MessageParamKey.URL]: TOP_URI, // In case of request containing malicious string, the page needs to be reset to the top page.
};
export const status429 = {
    [MessageParamKey.TITLE]: title.status429,
    [MessageParamKey.MESSAGE]: body.status429,
};
export const status503 = (maintenanceInfo: MaintenanceInfo) => ({
    [MessageParamKey.TITLE]: title.status503,
    [MessageParamKey.MESSAGE]: body.status503(maintenanceInfo),
    [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamKey.BUTTON_TEXT]: reloadButtonText,
});
export const status400And500 = (responseText: string) => {
    const param = {
        [MessageParamKey.MESSAGE]: body.status400And500(responseText),
        [MessageParamKey.BUTTON_TEXT]: reloadButtonText,
    };
    setRedirectUrl(param);
    return param;
};
export const notFound = {
    [MessageParamKey.TITLE]: title.notFound,
    [MessageParamKey.MESSAGE]: body.notFound,
    [MessageParamKey.URL]: TOP_URI,
};
export const unknownServerError = () => {
    const param: MessageParam = {};
    setRedirectUrl(param);
    return param;
};
export const insufficientPermissions = {
    [MessageParamKey.TITLE]: title.insufficientPermissions,
    [MessageParamKey.MESSAGE]: body.insufficientPermissions,
    [MessageParamKey.COLOR]: CSS_COLOR.RED,
    [MessageParamKey.URL]: TOP_URI,
};

function setRedirectUrl(param: MessageParam) {
    const uri = getURI();
    if (uri === TOP_URI) {
        param[MessageParamKey.URL] = LOGIN_URI;
        param[MessageParamKey.LOGOUT] = true;
    } else if (uri === LOGIN_URI) {
        param[MessageParamKey.URL] = LOGIN_URI; // This will strip away any query string that might cause the problem.
    } else {
        param[MessageParamKey.URL] = TOP_URI;
    }
}
