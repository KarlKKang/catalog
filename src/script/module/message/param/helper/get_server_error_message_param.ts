import { getFullPath } from '../../../dom/location/get/full_path';
import { TOP_URI } from '../../../env/uri';
import { reloadButtonText } from '../../../text/button/reload';
import { type MessageParam, MessageParamKey } from '../../type';
import { createBackToTopButton } from './create_back_to_top_button';

export function getServerErrorMessageParam(message?: string | HTMLElement) {
    const param: MessageParam = {};
    if (message !== undefined) {
        param[MessageParamKey.MESSAGE] = message;
    }
    if (getFullPath() === TOP_URI) {
        param[MessageParamKey.BUTTON] = reloadButtonText;
    } else {
        param[MessageParamKey.BUTTON] = createBackToTopButton();
        param[MessageParamKey.URL] = TOP_URI;
    }
    return param;
}
