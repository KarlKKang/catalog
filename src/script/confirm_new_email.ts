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
import { expired, emailChanged, emailAlreadyRegistered } from './module/message/template/param';

addEventListener(w, 'load', function () {
    if (!checkBaseURL(TOP_URL + '/confirm_new_email') && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }

    clearCookies();

    const param = getURLParam('p');
    const keyID = getURLParam('key-id');
    const signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        redirect(LOGIN_URL, true);
        return;
    }
    if (keyID == null || !/^[a-zA-Z0-9~_-]+$/.test(keyID)) {
        redirect(TOP_URL, true);
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
            } else if (response == 'DUPLICATED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'DONE') {
                showMessage(emailChanged);
            } else {
                showMessage();
            }
        },
        content: "p=" + param + "&key-id=" + keyID + "&signature=" + signature,
        withCredentials: false
    });

});