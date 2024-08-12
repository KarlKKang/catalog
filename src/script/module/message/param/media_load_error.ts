import { mediaLoadError as mediaLoadErrorBody } from '../../text/media/load_error';
import { MessageParamKey } from '../type';

export const mediaLoadError = (url: string) => ({
    [MessageParamKey.MESSAGE]: mediaLoadErrorBody,
    [MessageParamKey.URL]: url,
});
