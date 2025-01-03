import { defaultErrorSuffix } from '../../text/default_error/suffix';
import { MessageParamKey } from '../type';
import { createServerErrorMessageRedirectParam } from './helper/create_server_error_redirect_param';

export function invalidResponse(closeWindowSetting?: true | string) {
    return {
        [MessageParamKey.MESSAGE]: `サーバーが無効な応答を返しました。${defaultErrorSuffix}`,
        ...createServerErrorMessageRedirectParam(closeWindowSetting),
    };
};
