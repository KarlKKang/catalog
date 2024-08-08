import { emailSentSuffix, mediaLoadError as mediaLoadErrorBody } from '../text/message/body';
import { emailSent as emailSentTitle } from '../text/message/title';
import { MessageParam, MessageParamKey } from './type';
import { CSS_COLOR } from '../style/value';

export const expired = {
    [MessageParamKey.TITLE]: '期限が切れています',
    [MessageParamKey.MESSAGE]: 'もう一度最初からやり直してください。',
    [MessageParamKey.BUTTON_TEXT]: null,
};
export const emailSent = (goBackUrl?: string) => {
    const param: MessageParam = {
        [MessageParamKey.TITLE]: emailSentTitle,
        [MessageParamKey.MESSAGE]: emailSentSuffix,
        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
    };
    if (goBackUrl === undefined) {
        param[MessageParamKey.BUTTON_TEXT] = null;
    } else {
        param[MessageParamKey.URL] = goBackUrl;
    }
    return param;
};
export const mediaLoadError = (url: string) => ({
    [MessageParamKey.MESSAGE]: mediaLoadErrorBody,
    [MessageParamKey.URL]: url,
});
