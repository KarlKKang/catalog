import {
    TOP_URL,
} from '../module/env/constant';
import {
    getURLParam,
} from '../module/common';
import { show as showMessage } from '../module/message';
import { unrecommendedBrowser } from '../module/message/template/param';
import { UNRECOMMENDED_BROWSER } from '../module/browser';
import { redirect } from '../module/global';

export function approvedCallback() {
    if (UNRECOMMENDED_BROWSER) {
        showMessage(unrecommendedBrowser(getForwardURL()));
    } else {
        redirect(getForwardURL(), true);
    }
}

function getForwardURL() {
    const series = getURLParam('series');
    if (series !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
        let url: string;
        let separator: '?' | '&' = '?';
        url = TOP_URL + '/bangumi/' + series;

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
        return TOP_URL + '/news/' + news + hashString;
    }

    const keywords = getURLParam('keywords');
    if (keywords !== null) {
        return TOP_URL + '?keywords=' + keywords;
    }

    return TOP_URL;
}