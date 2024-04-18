import * as body from './body';
import * as title from './title';
import { LOGIN_URL, TOP_URL } from '../../env/constant';
import type { MaintenanceInfo } from '../../type/MaintenanceInfo';
import { getBaseURL } from '../../dom/document';
import { MessageParamProp, type MessageParam } from '../../message/type';
import { CSS_COLOR } from '../../style/value';

const reloadButtonText = '再読み込み';
export const invalidResponse = () => {
    const param: MessageParam = {
        [MessageParamProp.MESSAGE]: body.invalidResponse,
    };
    setRedirectUrl(param);
    return param;
};
export const sessionEnded = (url: string) => ({
    [MessageParamProp.TITLE]: title.sessionEnded,
    [MessageParamProp.MESSAGE]: body.sessionEnded,
    [MessageParamProp.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamProp.URL]: url
});
export const mediaSessionEnded = {
    [MessageParamProp.TITLE]: title.sessionEnded,
    [MessageParamProp.MESSAGE]: body.mediaSessionEnded,
    [MessageParamProp.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamProp.URL]: TOP_URL
};
export const connectionError = {
    [MessageParamProp.TITLE]: title.connectionError,
    [MessageParamProp.MESSAGE]: body.connectionError,
    [MessageParamProp.REPLACE_BODY]: true,
    [MessageParamProp.URL]: TOP_URL // In case of request containing malicious string, the page needs to be reset to the top page.
};
export const status429 = {
    [MessageParamProp.TITLE]: title.status429,
    [MessageParamProp.MESSAGE]: body.status429
};
export const status503 = (maintenanceInfo: MaintenanceInfo) => ({
    [MessageParamProp.TITLE]: title.status503,
    [MessageParamProp.MESSAGE]: body.status503(maintenanceInfo),
    [MessageParamProp.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamProp.BUTTON_TEXT]: reloadButtonText
});
export const status400And500 = (responseText: string) => {
    const param = {
        [MessageParamProp.MESSAGE]: body.status400And500(responseText),
        [MessageParamProp.BUTTON_TEXT]: reloadButtonText
    };
    setRedirectUrl(param);
    return param;
};
export const notFound = {
    [MessageParamProp.TITLE]: title.notFound,
    [MessageParamProp.MESSAGE]: body.notFound,
    [MessageParamProp.URL]: TOP_URL
};
export const unknownServerError = () => {
    const param: MessageParam = {};
    setRedirectUrl(param);
    return param;
};
export const insufficientPermissions = {
    [MessageParamProp.TITLE]: title.insufficientPermissions,
    [MessageParamProp.MESSAGE]: body.insufficientPermissions,
    [MessageParamProp.COLOR]: CSS_COLOR.RED,
    [MessageParamProp.URL]: TOP_URL
};

function setRedirectUrl(param: MessageParam) {
    const href = getBaseURL();
    if (href === TOP_URL) {
        param[MessageParamProp.URL] = LOGIN_URL;
        param[MessageParamProp.LOGOUT] = true;
    } else if (href === LOGIN_URL) {
        param[MessageParamProp.URL] = LOGIN_URL; // This will strip away any query string that might cause the problem.
    } else {
        param[MessageParamProp.URL] = TOP_URL;
    }
}