import { createBRElement } from '../../../dom/element/br/create';
import { createParagraphElement } from '../../../dom/element/paragraph/create';
import { appendText } from '../../../dom/element/text/append';
import { appendChild } from '../../../dom/node/append_child';
import { defaultErrorSuffix } from '../../../text/default_error/suffix';
import { createServerErrorMessageRedirectParam } from '../../../message/param/helper/create_server_error_redirect_param';
import { MessageParamKey } from '../../../message/type';

export function status400And500(responseText: string, closeWindowSetting: true | string | undefined) {
    return {
        [MessageParamKey.MESSAGE]: status400And500Body(responseText),
        ...createServerErrorMessageRedirectParam(closeWindowSetting),
    };
};

function status400And500Body(responseText: string) {
    const container = createParagraphElement();
    appendText(container, 'サーバーからの応答：' + responseText);
    appendChild(container, createBRElement());
    appendText(container, defaultErrorSuffix);
    return container;
}
