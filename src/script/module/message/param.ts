import { defaultErrorSuffix, emailSentSuffix } from '../text/message/body';
import { emailSent as emailSentTitle } from '../text/message/title';
import { MessageParam, MessageParamProp } from './type';
import { CSS_COLOR } from '../style/value';

export const moduleImportError = {
    [MessageParamProp.MESSAGE]: 'ページの読み込みに失敗しました。再読み込みをお試しください。' + defaultErrorSuffix,
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