import { getServerErrorMessageTemplate } from '../../../message/param/helper/get_server_error_message_template';

export function unknownServerError(closeWindowSetting: true | string | undefined) {
    return getServerErrorMessageTemplate(closeWindowSetting);
};
