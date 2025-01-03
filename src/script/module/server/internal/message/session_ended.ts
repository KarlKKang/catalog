import { TOP_URI } from '../../../env/uri';
import { createBackToTopButton } from '../../../message/param/helper/create_back_to_top_button';
import { createMessageRedirectParam } from '../../../message/param/helper/create_redirect_param';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { sessionEndedTitle } from './internal/session_ended_title';

export function sessionEnded(closeWindowSetting: true | string | undefined) {
    return {
        [MessageParamKey.TITLE]: sessionEndedTitle,
        [MessageParamKey.MESSAGE]: 'セッションがタイムアウトした、または別のタブで新しいセッションが開始されました。',
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        ...createMessageRedirectParam(
            TOP_URI,
            createBackToTopButton(),
            closeWindowSetting === undefined ? closeWindowSetting : true,
        ),
    };
};
