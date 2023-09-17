import { addClass, appendChild, appendChildren, appendListItems, appendText, createAnchorElement, createDivElement, createLIElement, createParagraphElement, createUListElement } from '../../../dom';
import { TOP_DOMAIN } from '../../../env/constant';
import { getLocalTime } from '../../../main/pure';
import { MaintenanceInfo } from '../../../type/MaintenanceInfo';
import { defaultErrorSuffix } from '../comm';

export const invalidResponse = `サーバーが無効な応答を返しました。${defaultErrorSuffix}`;
export const sessionEnded = 'セッションがタイムアウトした、または別のソースからのアクティビティによって新しいセッションが開始された。';
export const connectionError = function () {
    const container = createDivElement();
    const text = createParagraphElement();
    appendText(text, 'これは次のような理由が考えられます：');
    const list = createUListElement();
    appendListItems(
        list,
        'インターネットが切断されています。インターネット接続環境をご確認の上、再度お試しください。',
        'サーバーに障害が発生しています。しばらく待ってからもう一度お試しください。',
        'リクエストには、ファイアウォールによってブロックされている無効な文字列が含まれています。',
    );

    const listItem = createLIElement();
    appendText(listItem, 'あなたのIPアドレスはブラックリストに登録され、ファイアウォールでブロックされています。管理者（');
    const emailLink = createAnchorElement();
    addClass(emailLink, 'link');
    emailLink.href = 'mailto:admin@' + TOP_DOMAIN;
    appendText(emailLink, 'admin@' + TOP_DOMAIN);
    appendChild(listItem, emailLink);
    appendText(listItem, '）またはISPにお問い合わせください。');
    appendChild(list, listItem);

    appendChildren(container, text, list);
    return container.innerHTML;
}();

export const status429 = 'リクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。';
export const status503 = (maintenanceInfo: MaintenanceInfo) => {
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
export const status400And500 = (responseText: string) => 'サーバーからの応答：' + responseText + `<br>${defaultErrorSuffix}`;
export const notFound = 'URLが間違っているか、ページが存在しません。ご確認の上、再度お試しください。';