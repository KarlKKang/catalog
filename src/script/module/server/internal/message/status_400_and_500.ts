import { createBRElement } from '../../../dom/element/br/create';
import { createParagraphElement } from '../../../dom/element/paragraph/create';
import { appendText } from '../../../dom/element/text/append';
import { appendChild } from '../../../dom/node/append_child';
import { MessageParamKey } from '../../../message/type';
import { reloadButtonText } from '../../../text/button/reload';
import { defaultErrorSuffix } from '../../../text/default_error/suffix';
import { setErrorMessageRedirectUrl } from '../../../message/param/helper/set_error_message_redirect_url';

export function status400And500(responseText: string) {
    const param = {
        [MessageParamKey.MESSAGE]: status400And500Body(responseText),
        [MessageParamKey.BUTTON]: reloadButtonText,
    };
    setErrorMessageRedirectUrl(param);
    return param;
};

function status400And500Body(responseText: string) {
    const container = createParagraphElement();
    appendText(container, 'サーバーからの応答：' + responseText);
    appendChild(container, createBRElement());
    appendText(container, defaultErrorSuffix);
    return container;
}
