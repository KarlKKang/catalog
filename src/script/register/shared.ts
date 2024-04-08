import { MessageParamProp } from "../module/message/type";
import { emailAlreadyRegistered as emailAlreadyRegisteredBody } from '../module/text/message/body';

export const emailAlreadyRegistered = {
    [MessageParamProp.TITLE]: '失敗しました',
    [MessageParamProp.MESSAGE]: emailAlreadyRegisteredBody,
    [MessageParamProp.BUTTON_TEXT]: null
};