import { appendListItems, appendText, createBRElement, createDivElement, createEmailLink, createLIElement, createParagraphElement, createUListElement } from '../../dom/create_element';
import { appendChild, appendChildren } from '../../dom/element';
import { TOP_DOMAIN } from '../../env/domain';
import { getLocalTimeString } from '../../common/pure';
import { type MaintenanceInfo, MaintenanceInfoKey } from '../../type/MaintenanceInfo';
import { defaultErrorSuffix } from '../../text/message/body';

export const invalidResponse = `サーバーが無効な応答を返しました。${defaultErrorSuffix}`;
export const sessionEnded = 'もう一度ログインしてください。';
export const mediaSessionEnded = 'セッションがタイムアウトした、または別のソースからのアクティビティによって新しいセッションが開始された。';
export const connectionError = function () {
    const container = createDivElement();
    const text = createParagraphElement('これは次のような理由が考えられます：');
    const list = createUListElement();
    appendListItems(
        list,
        'インターネットが切断されています。インターネット接続環境をご確認の上、再度お試しください。',
        'サーバーに障害が発生しています。しばらく待ってからもう一度お試しください。',
        'リクエストには、ファイアウォールによってブロックされている無効な文字列が含まれています。',
    );

    const listItem = createLIElement();
    appendText(listItem, 'あなたのIPアドレスはブラックリストに登録され、ファイアウォールでブロックされています。管理者（');
    appendChild(listItem, createEmailLink('admin@' + TOP_DOMAIN));
    appendText(listItem, '）またはISPにお問い合わせください。');
    appendChild(list, listItem);

    appendChildren(container, text, list);
    return container;
}();

export const status429 = 'リクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。';
export const status503 = (maintenanceInfo: MaintenanceInfo) => {
    let message = '';
    const suffix = 'ご不便をおかけして申し訳ありません。';
    const period = maintenanceInfo[MaintenanceInfoKey.PERIOD];
    if (period > 0) {
        const endTime = getLocalTimeString(maintenanceInfo[MaintenanceInfoKey.START] + period, false, false);
        message = `メンテナンス期間は${endTime}までとさせていただきます。${suffix}`;
    } else {
        message = suffix + '後ほどもう一度お試しください。';
    }
    return message;
};
export const status400And500 = (responseText: string) => {
    const container = createParagraphElement();
    appendText(container, 'サーバーからの応答：' + responseText);
    appendChild(container, createBRElement());
    appendText(container, defaultErrorSuffix);
    return container;
};
export const notFound = 'URLが間違っているか、ページが存在しません。ご確認の上、再度お試しください。';
export const insufficientPermissions = 'このページを閲覧する権限がありません。';