import { defaultErrorSuffix, emailSentSuffix } from '../text/message/body';
import { emailSent as emailSentTitle } from '../text/message/title';
import { MessageParam, MessageParamProp } from './type';
import { isString } from '../type/helper';
import { CSS_COLOR } from '../style/value';

export const moduleImportError = (e: unknown) => {
    let message = 'モジュールの読み込みに失敗しました。' + defaultErrorSuffix;
    if (isString(e)) {
        message += `<br>${e}`;
    } else if (e instanceof Error) {
        message += `<br>${e.message}`;
    }
    return { [MessageParamProp.MESSAGE]: message };
};
export const expired = {
    [MessageParamProp.TITLE]: '期限が切れています',
    [MessageParamProp.MESSAGE]: 'もう一度最初からやり直してください。',
    [MessageParamProp.BUTTON_TEXT]: null
};
export const emailSent = (goBackUrl?: string) => {
    const param: MessageParam = {
        [MessageParamProp.TITLE]: emailSentTitle,
        [MessageParamProp.MESSAGE]: emailSentSuffix,
        [MessageParamProp.COLOR]: CSS_COLOR.GREEN,
    };
    if (goBackUrl === undefined) {
        param[MessageParamProp.BUTTON_TEXT] = null;
    } else {
        param[MessageParamProp.URL] = goBackUrl;
    }
    return param;
};