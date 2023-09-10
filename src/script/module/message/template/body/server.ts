import { getLocalTime } from '../../../main';
import { MaintenanceInfo } from '../../../type/MaintenanceInfo';
import { defaultErrorSuffix } from '../comm';

export const invalidResponse = `サーバーが無効な応答を返しました。${defaultErrorSuffix}`;
export const sessionEnded = 'セッションがタイムアウトした、または別のソースからのアクティビティによって新しいセッションが開始された。';
export const connectionError = 'インターネット接続環境をご確認の上、再度お試しください。';
export const status429 = 'リクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。';
export const status503 = function (maintenanceInfo: MaintenanceInfo) {
    let message = '';
    const suffix = 'ご不便をおかけして申し訳ありません。';
    if (maintenanceInfo.period > 0) {
        const endTime = getLocalTime(maintenanceInfo.start + maintenanceInfo.period);
        message = `メンテナンス期間は${endTime.year}年${endTime.month}月${endTime.date}日（${endTime.dayOfWeek}）${endTime.hour.toString().padStart(2, '0')}:${endTime.minute.toString().padStart(2, '0')}までとさせていただきます。${suffix}`;
    } else {
        message = suffix + '後ほどもう一度お試しください。';
    }
    return message;
};
export const status400And500 = function (responseText: string) {
    return 'サーバーからの応答：' + responseText + `<br>${defaultErrorSuffix}`;
};
export const status403 = `サーバーがリクエストを拒否しました。${defaultErrorSuffix}`;