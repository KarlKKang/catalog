import { type MessageParam, MessageParamKey } from '../type';
import { defaultErrorSuffix } from '../../text/default_error/suffix';
import { setErrorMessageRedirectUrl } from './helper/set_error_message_redirect_url';

export function invalidResponse() {
    const param: MessageParam = {
        [MessageParamKey.MESSAGE]: `サーバーが無効な応答を返しました。${defaultErrorSuffix}`,
    };
    setErrorMessageRedirectUrl(param);
    return param;
};
