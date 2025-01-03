import { TOP_URI } from '../../env/uri';
import { MessageParamKey } from '../type';
import { notFoundBody } from '../../text/not_found/body';
import { notFoundTitle } from '../../text/not_found/title';
import { createBackToTopButton } from './helper/create_back_to_top_button';
import { getMessageRedirectParam } from './helper/get_message_redirect_param';

export function notFound(closeWindowSetting?: true | string) {
    return {
        [MessageParamKey.TITLE]: notFoundTitle,
        [MessageParamKey.MESSAGE]: notFoundBody,
        ...getMessageRedirectParam(TOP_URI, createBackToTopButton(), closeWindowSetting),
    };
};
