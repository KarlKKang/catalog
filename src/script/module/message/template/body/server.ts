import {defaultErrorSuffix} from "../comm";

export const invalidResponse = `サーバーが無効な応答を返しました。${defaultErrorSuffix}`;
export const connectionError = `数分待ってから、もう一度お試しください。${defaultErrorSuffix}`;
export const status429 = "サーバーにリクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。";
export const status503 = "ご不便をおかけして申し訳ありません。後ほどもう一度お試しください。";
export const status400And500 = function (responseText: string) {
    return "サーバーからの応答：" + responseText + `<br>${defaultErrorSuffix}`;
};
export const status403 = `サーバーがリクエストを拒否しました。${defaultErrorSuffix}`;