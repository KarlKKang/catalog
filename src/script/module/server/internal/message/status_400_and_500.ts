import { createBRElement } from '../../../dom/element/br/create';
import { createParagraphElement } from '../../../dom/element/paragraph/create';
import { appendText } from '../../../dom/element/text/append';
import { appendChild } from '../../../dom/node/append_child';
import { defaultErrorSuffix } from '../../../text/default_error/suffix';
import { getServerErrorMessageTemplate } from '../../../message/param/helper/get_server_error_message_template';
import { MessageParamKey } from '../../../message/type';

export function status400And500(responseText: string) {
    const param = getServerErrorMessageTemplate();
    param[MessageParamKey.MESSAGE] = status400And500Body(responseText);
    return param;
};

function status400And500Body(responseText: string) {
    const container = createParagraphElement();
    appendText(container, 'サーバーからの応答：' + responseText);
    appendChild(container, createBRElement());
    appendText(container, defaultErrorSuffix);
    return container;
}
