import {
    getURLParam,
} from '../module/common';
import { showMessage } from '../module/message';
import { UNRECOMMENDED_BROWSER } from '../module/browser';
import { redirect } from '../module/global';
import { nextButtonText } from '../module/text/ui';
import { CSS_COLOR } from '../module/style/value';
import { MessageParamProp } from '../module/message/type';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI, TOP_URI } from '../module/env/uri';

export default function () {
    if (UNRECOMMENDED_BROWSER) {
        showMessage({
            [MessageParamProp.TITLE]: 'お使いのブラウザは推奨環境ではありません',
            [MessageParamProp.MESSAGE]: '一部のコンテンツが正常に再生されない場合は、Safari 12またはChrome 63以降のブラウザをお使いください。',
            [MessageParamProp.COLOR]: CSS_COLOR.ORANGE,
            [MessageParamProp.URL]: getForwardURL(),
            [MessageParamProp.BUTTON_TEXT]: nextButtonText
        });
    } else {
        redirect(getForwardURL(), true);
    }
}

function getForwardURL() {
    const series = getURLParam('series');
    if (series !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
        let url: string;
        let separator: '?' | '&' = '?';
        url = BANGUMI_ROOT_URI + series;

        const ep = getURLParam('ep');
        if (ep !== null && ep !== '1') {
            url += separator + 'ep=' + ep;
            separator = '&';
        }

        const format = getURLParam('format');
        if (format !== null && format !== '1') {
            url += separator + 'format=' + format;
        }
        return url;
    }

    const news = getURLParam('news');
    if (news !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(news)) {
        const hash = getURLParam('hash');
        const hashString = (hash === null) ? '' : ('#' + hash);
        return NEWS_ROOT_URI + news + hashString;
    }

    const keywords = getURLParam('keywords');
    if (keywords !== null) {
        return TOP_URI + '?keywords=' + keywords;
    }

    return TOP_URI;
}