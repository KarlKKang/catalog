import { defaultErrorSuffix } from '../../text/default_error/suffix';
import { MessageParamKey } from '../type';
import { getServerErrorMessageTemplate } from './helper/get_server_error_message_template';

export function invalidResponse(closeWindowSetting?: true | string) {
    return {
        [MessageParamKey.MESSAGE]: `サーバーが無効な応答を返しました。${defaultErrorSuffix}`,
        ...getServerErrorMessageTemplate(closeWindowSetting),
    };
};
