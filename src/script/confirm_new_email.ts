// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    LOGIN_URL,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    checkBaseURL,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { expired, emailChanged } from './module/message/template/param';

addEventListener(w, 'load', function () {
    if (!checkBaseURL(TOP_URL + '/confirm_new_email') && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }

    clearCookies();

    const param = getURLParam('p');
    const signature = getURLParam('signature');

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