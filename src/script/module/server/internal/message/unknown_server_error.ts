import { getServerErrorMessageTemplate } from '../../../message/param/helper/get_server_error_message_template';

export function unknownServerError() {
    return getServerErrorMessageTemplate();
};
