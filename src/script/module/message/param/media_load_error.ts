import { mediaLoadError as mediaLoadErrorBody } from '../../text/media/load_error';
import { MessageParamKey } from '../type';

export function mediaLoadError(url: string) {
    return {
        [MessageParamKey.MESSAGE]: mediaLoadErrorBody,
        [MessageParamKey.URL]: url,
    };
}
