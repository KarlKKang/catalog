import { TOP_URI } from '../../../env/uri';
import { createBackToTopButton } from '../../../message/param/helper/create_back_to_top_button';
import { getMessageRedirectParam } from '../../../message/param/helper/get_message_redirect_param';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';

export function insufficientPermissions(closeWindowSetting: true | string | undefined) {
    return {
        [MessageParamKey.TITLE]: 'アクセスできません',
        [MessageParamKey.MESSAGE]: 'このページを閲覧する権限がありません。',
        [MessageParamKey.COLOR]: CSS_COLOR.RED,
        ...getMessageRedirectParam(TOP_URI, createBackToTopButton(), closeWindowSetting),
    };
}
