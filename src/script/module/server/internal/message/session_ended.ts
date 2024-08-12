import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { sessionEndedTitle } from './internal/session_ended_title';

export function sessionEnded(url: string) {
    return {
        [MessageParamKey.TITLE]: sessionEndedTitle,
        [MessageParamKey.MESSAGE]: 'もう一度ログインしてください。',
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        [MessageParamKey.URL]: url,
    };
};
