import {
    TOP_URL,
} from '../env/constant';
import { getTitle, setSessionStorage, getFullURL } from '../dom/document';
import { defaultError } from '../text/message/title';
import { MessageParamProp, type MessageParam } from './type';
import { redirect } from '../global';
import { defaultErrorSuffix } from '../text/message/body';
import { CSS_COLOR } from '../style/value';
import { goBackButtonText } from '../text/ui';

export function showMessage({
    [MessageParamProp.MESSAGE]: message,
    [MessageParamProp.TITLE]: title,
    [MessageParamProp.COLOR]: color,
    [MessageParamProp.URL]: url,
    [MessageParamProp.BUTTON_TEXT]: buttonText,
    [MessageParamProp.LOGOUT]: logout,
    [MessageParamProp.REPLACE_BODY]: replaceBody
}: MessageParam) {
    setSessionStorage('message', message ?? ('不明なエラーが発生しました。' + defaultErrorSuffix));
    setSessionStorage('title', title ?? defaultError);
    setSessionStorage('color', (color ?? CSS_COLOR.RED).toString());
    setSessionStorage('document-title', getTitle());

    if (buttonText !== null) {
        setSessionStorage('button-text', buttonText ?? goBackButtonText);
        if (url === undefined) {
            setSessionStorage('url', getFullURL());
        } else {
            setSessionStorage('url', url);
        }
    }

    if (logout) {
        setSessionStorage('logout', '1');
    }
    if (replaceBody) {
        setSessionStorage('replace-body', '1');
    }

    redirect(TOP_URL + '/message', true);
}