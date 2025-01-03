import { mediaLoadError as mediaLoadErrorBody } from '../../text/media/load_error';
import { type MessageParam, MessageParamKey } from '../type';

export function mediaLoadError(url: string, closeWindow = false) {
    const param: MessageParam = {
        [MessageParamKey.MESSAGE]: mediaLoadErrorBody,
    };
    param[MessageParamKey.URL] = url;
    if (closeWindow) {
        param[MessageParamKey.BUTTON] = null;
    }
    return param;
}
