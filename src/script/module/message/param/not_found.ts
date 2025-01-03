import { TOP_URI } from '../../env/uri';
import { MessageParamKey } from '../type';
import { notFoundBody } from '../../text/not_found/body';
import { notFoundTitle } from '../../text/not_found/title';
import { createBackToTopButton } from './helper/create_back_to_top_button';
import { createMessageRedirectParam } from './helper/create_redirect_param';

export function notFound(closeWindowSetting?: true | string) {
    return {
        [MessageParamKey.TITLE]: notFoundTitle,
        [MessageParamKey.MESSAGE]: notFoundBody,
        ...createMessageRedirectParam(TOP_URI, createBackToTopButton(), closeWindowSetting),
    };
};
