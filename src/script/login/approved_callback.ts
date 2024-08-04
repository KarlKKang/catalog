import { showMessage } from '../module/message';
import { UNRECOMMENDED_BROWSER } from '../module/browser';
import { redirect } from '../module/global';
import { nextButtonText } from '../module/text/ui';
import { CSS_COLOR } from '../module/style/value';
import { MessageParamKey } from '../module/message/type';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI, TOP_URI } from '../module/env/uri';
import { getSearchParam } from '../module/dom/document';

export default function () {
    if (UNRECOMMENDED_BROWSER) {
        showMessage({
            [MessageParamKey.TITLE]: 'お使いのブラウザは推奨環境ではありません',
            [MessageParamKey.MESSAGE]: '一部のコンテンツが正常に再生されない場合は、Safari 12またはChrome 63以降のブラウザをお使いください。',
            [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
            [MessageParamKey.URL]: getForwardURL(),
            [MessageParamKey.BUTTON_TEXT]: nextButtonText,
        });
    } else {
        redirect(getForwardURL(), true);
    }
}

function getForwardURL() {
    const series = getSearchParam('series');
    if (series !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
        let url: string;
        let separator: '?' | '&' = '?';
        url = BANGUMI_ROOT_URI + series;

        const ep = getSearchParam('ep');
        if (ep !== null && ep !== '1') {
            url += separator + 'ep=' + ep;
            separator = '&';
        }

        const format = getSearchParam('format');
        if (format !== null && format !== '1') {
            url += separator + 'format=' + format;
        }
        return url;
    }

    const news = getSearchParam('news');
    if (news !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(news)) {
        const hash = getSearchParam('hash');
        const hashString = (hash === null) ? '' : ('#' + hash);
        return NEWS_ROOT_URI + news + hashString;
    }

    const keywords = getSearchParam('keywords');
    if (keywords !== null) {
        return TOP_URI + '?keywords=' + keywords;
    }

    return TOP_URI;
}
