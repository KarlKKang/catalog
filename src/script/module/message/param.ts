import { defaultErrorSuffix, emailSentSuffix } from '../text/message/body';
import { emailSent as emailSentTitle } from '../text/message/title';
import { MessageParam } from './type';
import { isString } from '../type/helper';
import { CSS_COLOR } from '../style/value';

export const moduleImportError = (e: unknown) => {
    let message = 'モジュールの読み込みに失敗しました。' + defaultErrorSuffix;
    if (isString(e)) {
        message += `<br>${e}`;
    } else if (e instanceof Error) {
        message += `<br>${e.message}`;
    }
    return { message: message };
};
export const expired = {
    title: '期限が切れています',
    message: 'もう一度最初からやり直してください。',
    buttonText: null
};
export const emailSent = (goBackUrl?: string) => {
    const param: MessageParam = {
        title: emailSentTitle,
        message: emailSentSuffix,
        color: CSS_COLOR.GREEN,
    };
    if (goBackUrl === undefined) {
        param.buttonText = null;
    } else {
        param.url = goBackUrl;
    }
    return param;
};