import { getTitle } from '../dom/document/title/get';
import { getFullPath } from '../dom/location';
import { defaultError } from '../text/message/title';
import { MessageParamKey, type MessageParam } from './type';
import { redirect } from '../global';
import { defaultErrorSuffix } from '../text/message/body';
import { CSS_COLOR } from '../style/color';
import { goBackButtonText } from '../text/ui';
import { MESSAGE_URI } from '../env/uri';

export const enum MessageParamInternalKey {
    DOCUMENT_TITLE = MessageParamKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
}
interface MessageParamInternal extends Required<MessageParam> {
    [MessageParamInternalKey.DOCUMENT_TITLE]: string;
}
let messageParam: MessageParamInternal | null = null;

export function showMessage({
    [MessageParamKey.MESSAGE]: message,
    [MessageParamKey.TITLE]: title,
    [MessageParamKey.COLOR]: color,
    [MessageParamKey.URL]: url,
    [MessageParamKey.BUTTON_TEXT]: buttonText,
    [MessageParamKey.LOGOUT]: logout,
}: MessageParam) {
    if (buttonText !== null) {
        buttonText = buttonText ?? goBackButtonText;
    }
    messageParam = {
        [MessageParamKey.MESSAGE]: message ?? ('不明なエラーが発生しました。' + defaultErrorSuffix),
        [MessageParamKey.TITLE]: title ?? defaultError,
        [MessageParamKey.COLOR]: color ?? CSS_COLOR.RED,
        [MessageParamKey.URL]: url ?? getFullPath(),
        [MessageParamKey.BUTTON_TEXT]: buttonText,
        [MessageParamKey.LOGOUT]: logout ?? false,
        [MessageParamInternalKey.DOCUMENT_TITLE]: getTitle(),
    };
    redirect(MESSAGE_URI, true);
}

export function getMessageParam() {
    const _messageParam = messageParam;
    messageParam = null;
    return _messageParam;
}
