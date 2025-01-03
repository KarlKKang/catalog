import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { nextButtonText } from '../../../text/button/next';
import { sessionEndedTitle } from './internal/session_ended_title';

export function unauthorized(url: string) {
    return {
        [MessageParamKey.TITLE]: sessionEndedTitle,
        [MessageParamKey.MESSAGE]: 'もう一度ログインしてください。',
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        [MessageParamKey.URL]: url,
        [MessageParamKey.BUTTON]: nextButtonText,
        [MessageParamKey.REDIRECT_WITHOUT_HISTORY]: true,
    };
};
