import { CSS_COLOR } from '../../style/color';
import { emailSentSuffix } from '../../text/send_mail/suffix';
import { emailSentTitle } from '../../text/send_mail/title';
import { MessageParam, MessageParamKey } from '../type';

export const emailSent = (goBackUrl?: string) => {
    const param: MessageParam = {
        [MessageParamKey.TITLE]: emailSentTitle,
        [MessageParamKey.MESSAGE]: emailSentSuffix,
        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
    };
    if (goBackUrl === undefined) {
        param[MessageParamKey.BUTTON] = null;
    } else {
        param[MessageParamKey.URL] = goBackUrl;
    }
    return param;
};
