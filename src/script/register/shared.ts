import { MessageParamKey } from '../module/message/type';
import { emailAlreadyRegistered as emailAlreadyRegisteredBody } from '../module/text/email/already_registered';

export const emailAlreadyRegistered = {
    [MessageParamKey.TITLE]: '失敗しました',
    [MessageParamKey.MESSAGE]: emailAlreadyRegisteredBody,
    [MessageParamKey.BUTTON_TEXT]: null,
};
