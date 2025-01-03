import { createServerErrorMessageRedirectParam } from '../../../message/param/helper/create_server_error_redirect_param';

export function unknownServerError(closeWindowSetting: true | string | undefined) {
    return createServerErrorMessageRedirectParam(closeWindowSetting);
};
