import { getFullPath } from '../../../dom/location/get/full_path';
import { TOP_URI } from '../../../env/uri';
import { reloadButtonText } from '../../../text/button/reload';
import { MessageParamKey } from '../../type';
import { createBackToTopButton } from './create_back_to_top_button';
import { getMessageRedirectParam } from './get_message_redirect_param';

export function getServerErrorMessageTemplate(closeWindowSetting: true | string | undefined) {
    if (getFullPath() === TOP_URI) {
        return { [MessageParamKey.BUTTON]: reloadButtonText };
    } else {
        return getMessageRedirectParam(TOP_URI, createBackToTopButton(), closeWindowSetting);
    }
}
