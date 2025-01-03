import { defaultErrorSuffix } from '../../text/default_error/suffix';
import { getServerErrorMessageParam } from './helper/get_server_error_message_param';

export function invalidResponse() {
    return getServerErrorMessageParam(`サーバーが無効な応答を返しました。${defaultErrorSuffix}`);
};
