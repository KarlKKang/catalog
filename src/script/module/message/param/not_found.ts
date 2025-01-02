import { TOP_URI } from '../../env/uri';
import { MessageParamKey } from '../type';
import { notFoundBody } from '../../text/not_found/body';
import { notFoundTitle } from '../../text/not_found/title';
import { createBackToTopButton } from './helper/create_back_to_top_button';

export function notFound() {
    return {
        [MessageParamKey.TITLE]: notFoundTitle,
        [MessageParamKey.MESSAGE]: notFoundBody,
        [MessageParamKey.URL]: TOP_URI,
        [MessageParamKey.BUTTON]: createBackToTopButton(),
    };
};
