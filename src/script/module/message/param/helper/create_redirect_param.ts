import { type MessageParam, MessageParamKey } from '../../type';

interface MessageRedirectParam {
    [MessageParamKey.URL]?: Required<MessageParam>[MessageParamKey.URL];
    [MessageParamKey.BUTTON]?: Required<MessageParam>[MessageParamKey.BUTTON];
}

export function createMessageRedirectParam(
    url: Required<MessageParam>[MessageParamKey.URL],
    button: MessageParam[MessageParamKey.BUTTON],
    closeWindowSetting: true | string | undefined,
): MessageRedirectParam {
    if (closeWindowSetting === undefined) {
        return {
            [MessageParamKey.URL]: url,
            ...button !== undefined && { [MessageParamKey.BUTTON]: button },
        };
    } else {
        const param: MessageRedirectParam = {
            [MessageParamKey.BUTTON]: null,
        };
        if (closeWindowSetting !== true) {
            param[MessageParamKey.URL] = closeWindowSetting;
        }
        return param;
    }
}
