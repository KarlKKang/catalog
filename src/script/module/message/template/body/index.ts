import { isString } from '../../../type/helper';
import { defaultErrorSuffix, browserCompatibilitySuffix } from '../comm';
export { passwordChanged, emailAlreadyRegistered } from '../comm';
export { defaultErrorSuffix, browserCompatibilitySuffix };

export const unknownError = `不明なエラーが発生しました。${defaultErrorSuffix}`;
export const expired = 'もう一度最初からやり直してください。';
export const emailChanged = 'メールアドレスが変更されました。';
export const registerComplete = 'アカウントが登録されました。';
export const emailSent = '届くまでに時間がかかる場合があります。';
export const unrecommendedBrowser = '一部のコンテンツが正常に再生されない場合は、Safari 11またはChrome 63以降のブラウザをお使いください。';
export const moduleImportError = (e: unknown) => {
    let message: string = `モジュールの読み込みに失敗しました。${defaultErrorSuffix}`;
    if (isString(e)) {
        message += `<br>${e}`;
    } else if (e instanceof Error) {
        message += `<br>${e.message}`;
    }
    return message;
};
export const insufficientPermissions = 'このページを閲覧する権限がありません。';