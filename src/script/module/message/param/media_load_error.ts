import { mediaLoadError as mediaLoadErrorBody } from '../../text/media/load_error';
import { type MessageParam, MessageParamKey } from '../type';

export function mediaLoadError(url: string | null) {
    const param: MessageParam = {
        [MessageParamKey.MESSAGE]: mediaLoadErrorBody,
    };
    if (url === null) {
        param[MessageParamKey.BUTTON] = null;
    } else {
        param[MessageParamKey.URL] = url;
    }
    return param;
}
