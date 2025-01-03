import { MessageParamKey } from '../type';
import { TOP_URI } from '../../env/uri';
import { createEmailLink } from '../../dom/element/email_link/create';
import { appendListItems } from '../../dom/element/list/append_item';
import { createLIElement } from '../../dom/element/list/li/create';
import { createUListElement } from '../../dom/element/list/ul/create';
import { createDivElement } from '../../dom/element/div/create';
import { appendChildren } from '../../dom/node/append_children';
import { TOP_DOMAIN } from '../../env/domain';
import { appendText } from '../../dom/element/text/append';
import { createParagraphElement } from '../../dom/element/paragraph/create';
import { appendChild } from '../../dom/node/append_child';
import { CSS_TEXT_ALIGN, setTextAlign } from '../../style/text_align';

export function connectionError() {
    return {
        [MessageParamKey.TITLE]: 'サーバーに接続できません',
        [MessageParamKey.MESSAGE]: connectionErrorBody(),
        [MessageParamKey.URL]: TOP_URI, // In case of request containing malicious string, the page needs to be reset to the top page.
    };
}

function connectionErrorBody() {
    const container = createDivElement();
    setTextAlign(container, CSS_TEXT_ALIGN.LEFT);
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
};
