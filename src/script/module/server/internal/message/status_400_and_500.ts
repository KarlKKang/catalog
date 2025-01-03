import { createBRElement } from '../../../dom/element/br/create';
import { createParagraphElement } from '../../../dom/element/paragraph/create';
import { appendText } from '../../../dom/element/text/append';
import { appendChild } from '../../../dom/node/append_child';
import { defaultErrorSuffix } from '../../../text/default_error/suffix';
import { getServerErrorMessageParam } from '../../../message/param/helper/get_server_error_message_param';

export function status400And500(responseText: string) {
    return getServerErrorMessageParam(status400And500Body(responseText));
};

function status400And500Body(responseText: string) {
    const container = createParagraphElement();
    appendText(container, 'サーバーからの応答：' + responseText);
    appendChild(container, createBRElement());
    appendText(container, defaultErrorSuffix);
    return container;
}
