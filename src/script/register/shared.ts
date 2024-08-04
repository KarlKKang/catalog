import { MessageParamKey } from '../module/message/type';
import { emailAlreadyRegistered as emailAlreadyRegisteredBody } from '../module/text/message/body';

export const emailAlreadyRegistered = {
    [MessageParamKey.TITLE]: '失敗しました',
    [MessageParamKey.MESSAGE]: emailAlreadyRegisteredBody,
    [MessageParamKey.BUTTON_TEXT]: null,
};
