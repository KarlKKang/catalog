import {defaultErrorSuffix, browserCompatibilitySuffix} from "../comm";
export {passwordChanged, incompletedInvitation} from "../comm";
export {defaultErrorSuffix, browserCompatibilitySuffix};

export const unknownError = `不明なエラーが発生しました。${defaultErrorSuffix}`;
export const expired = 'もう一度やり直してください。';
export const emailChanged = 'メールアドレスが変更されました。';
export const invitationOnly = '現在、登録は招待制となっています。';
export const registerComplete = 'アカウントが登録されました。';
export const emailSent = 'メールボックスをご確認ください。届くまでに時間がかかる場合があります。';
export const specialRegistrationOnly = '現在、一般登録の受付を開始しています。ボタンをクリックして、登録ページにお進みください。';
export const unrecommendedBrowser = '一部のコンテンツが正常に再生されない場合は、Safari 11またはChrome 62以降のブラウザをお使いください。';
export var moduleImportError = function (e: unknown) {
    let message = "Cannot get message from exception.";
    if (typeof e === "string") {
        message = e;
    } else if (e instanceof Error) {
        message = e.message;
    }
    return `モジュールの読み込みに失敗しました。${defaultErrorSuffix}<br>` + message;
};

export const cssVarError = function (e: string) {
    return `cssの解析に失敗しました。${browserCompatibilitySuffix}<br>` + e;
};

export const lazyloadSrcMissing = `lazyload：画像のsrc属性が必要です。${defaultErrorSuffix}`;

export const javascriptError = function (e: string) {
    return `Error detail: ${e}<br>${defaultErrorSuffix}`;
};

export * as server from "./server";