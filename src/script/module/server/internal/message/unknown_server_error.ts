import { getServerErrorMessageParam } from '../../../message/param/helper/get_server_error_message_param';

export function unknownServerError() {
    return getServerErrorMessageParam();
};
