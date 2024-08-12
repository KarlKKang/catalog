import type { MessageParam } from '../../../message/type';
import { setErrorMessageRedirectUrl } from '../../../message/param/helper/set_error_message_redirect_url';

export function unknownServerError() {
    const param: MessageParam = {};
    setErrorMessageRedirectUrl(param);
    return param;
};
