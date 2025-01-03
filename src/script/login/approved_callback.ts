import { showMessage } from '../module/message';
import { UNRECOMMENDED_BROWSER } from '../module/browser/unrecommended_browser';
import { redirectSameOrigin } from '../module/global/redirect';
import { nextButtonText } from '../module/text/button/next';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { getForwardURL } from './helper';

export default function () {
    const forwardURL = getForwardURL();
    if (UNRECOMMENDED_BROWSER) {
        showMessage({
            [MessageParamKey.TITLE]: 'お使いのブラウザは推奨環境ではありません',
            [MessageParamKey.MESSAGE]: '一部のコンテンツが正常に再生されない場合は、Safari 12またはChrome 79以降のブラウザをお使いください。',
            [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
            [MessageParamKey.URL]: forwardURL,
            [MessageParamKey.BUTTON]: nextButtonText,
            [MessageParamKey.REDIRECT_WITHOUT_HISTORY]: true,
        });
    } else {
        redirectSameOrigin(forwardURL, true);
    }
}
