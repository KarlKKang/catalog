import { defaultErrorSuffix } from '../../text/default_error/suffix';
import { MessageParamKey } from '../type';
import { getServerErrorMessageTemplate } from './helper/get_server_error_message_template';

export function invalidResponse() {
    const param = getServerErrorMessageTemplate();
    param[MessageParamKey.MESSAGE] = `サーバーが無効な応答を返しました。${defaultErrorSuffix}`;
    return param;
};
