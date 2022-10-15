import { defaultErrorSuffix, browserCompatibilitySuffix } from '../comm';
export { passwordChanged, emailAlreadyRegistered } from '../comm';
export { defaultErrorSuffix, browserCompatibilitySuffix };

export const unknownError = `不明なエラーが発生しました。${defaultErrorSuffix}`;
export const expired = 'もう一度やり直してください。';
export const emailChanged = 'メールアドレスが変更されました。';
export const registerComplete = 'アカウントが登録されました。';
export const emailSent = '届くまでに時間がかかる場合があります。';
export const unrecommendedBrowser = '一部のコンテンツが正常に再生されない場合は、Safari 11またはChrome 62以降のブラウザをお使いください。';
export const moduleImportError = function (e: unknown) {
    let message = 'Cannot get message from exception.';
    if (typeof e === 'string') {
        message = e;
    } else if (e instanceof Error) {
        message = e.message;
    }
    return `モジュールの読み込みに失敗しました。${defaultErrorSuffix}<br>` + message;
};