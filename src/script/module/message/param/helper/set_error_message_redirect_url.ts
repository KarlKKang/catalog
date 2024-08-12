import { getURI } from '../../../dom/location/get/uri';
import { TOP_URI, LOGIN_URI } from '../../../env/uri';
import { type MessageParam, MessageParamKey } from '../../type';

export function setErrorMessageRedirectUrl(param: MessageParam) {
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
