import { showMessage } from '../module/message';
import { UNRECOMMENDED_BROWSER } from '../module/browser';
import { redirect } from '../module/global';
import { nextButtonText } from '../module/text/ui';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI, TOP_URI } from '../module/env/uri';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { buildURLForm, buildURI } from '../module/http_form';

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
        const ep = getSearchParam('ep');
        const format = getSearchParam('format');
        return buildURI(
            BANGUMI_ROOT_URI + series,
            buildURLForm({
                ...ep !== '1' && { ep: ep },
                ...format !== '1' && { format: format },
            }),
        );
    }

    const news = getSearchParam('news');
    if (news !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(news)) {
        return buildURI(NEWS_ROOT_URI + news, '', getSearchParam('hash'));
    }

    return buildURI(TOP_URI, buildURLForm({ keywords: getSearchParam('keywords') }));
}
