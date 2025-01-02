import { getFullPath } from '../dom/location/get/full_path';
import { defaultErrorTitle } from '../text/default_error/title';
import { MessageParamKey, type MessageParam } from './type';
import { redirectSameOrigin } from '../global/redirect';
import { defaultErrorSuffix } from '../text/default_error/suffix';
import { CSS_COLOR } from '../style/color';
import { goBackButtonText } from '../text/button/go_back';
import { MESSAGE_URI } from '../env/uri';

type MessageParamInternal = Required<MessageParam>;
let messageParam: MessageParamInternal | null = null;

export function showMessage({
    [MessageParamKey.MESSAGE]: message,
    [MessageParamKey.TITLE]: title,
    [MessageParamKey.COLOR]: color,
    [MessageParamKey.URL]: url,
    [MessageParamKey.BUTTON]: buttonText,
    [MessageParamKey.LOGOUT]: logout,
}: MessageParam) {
    if (buttonText !== null) {
        buttonText = buttonText ?? goBackButtonText;
    }
    messageParam = {
        [MessageParamKey.MESSAGE]: message ?? ('不明なエラーが発生しました。' + defaultErrorSuffix),
        [MessageParamKey.TITLE]: title ?? defaultErrorTitle,
        [MessageParamKey.COLOR]: color ?? CSS_COLOR.RED,
        [MessageParamKey.URL]: url ?? getFullPath(),
        [MessageParamKey.BUTTON]: buttonText,
        [MessageParamKey.LOGOUT]: logout ?? false,
    };
    redirectSameOrigin(MESSAGE_URI, true);
}

export function getMessageParam() {
    const _messageParam = messageParam;
    messageParam = null;
    return _messageParam;
}
