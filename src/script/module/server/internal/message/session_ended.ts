import { TOP_URI } from '../../../env/uri';
import { createBackToTopButton } from '../../../message/param/helper/create_back_to_top_button';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { sessionEndedTitle } from './internal/session_ended_title';

export function sessionEnded() {
    return {
        [MessageParamKey.TITLE]: sessionEndedTitle,
        [MessageParamKey.MESSAGE]: 'セッションがタイムアウトした、または別のタブで新しいセッションが開始されました。',
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        [MessageParamKey.URL]: TOP_URI,
        [MessageParamKey.BUTTON]: createBackToTopButton(),
    };
};
