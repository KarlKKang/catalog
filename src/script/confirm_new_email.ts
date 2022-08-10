// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { expired, emailChanged}  from './module/message/template/param';

addEventListener(w, 'load', function () {
    clearCookies();

    if (!getHref().startsWith('https://featherine.com/confirm_email') && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }

    var param = getURLParam('p');
    var signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        redirect(LOGIN_URL, true);
        return;
    }

    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('change_email.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'DONE') {
                showMessage(emailChanged);
            } else {
                showMessage();
            }
        },
        content: "p=" + param + "&signature=" + signature,
        withCredentials: false
    });

});