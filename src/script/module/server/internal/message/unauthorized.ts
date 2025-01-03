import { createMessageRedirectParam } from '../../../message/param/helper/create_redirect_param';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { nextButtonText } from '../../../text/button/next';
import { sessionEndedTitle } from './internal/session_ended_title';

export function unauthorized(url: string, closeWindowSetting: true | string | undefined) {
    return {
        [MessageParamKey.TITLE]: sessionEndedTitle,
        [MessageParamKey.MESSAGE]: 'もう一度ログインしてください。',
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        [MessageParamKey.REDIRECT_WITHOUT_HISTORY]: true,
        ...createMessageRedirectParam(
            url,
            nextButtonText,
            closeWindowSetting === undefined ? closeWindowSetting : url,
        ),
    };
};
