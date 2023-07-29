// JavaScript Document
import {
    DEVELOPMENT,
    TOP_URL,
} from './module/env/constant';
import {
    logout,
    clearCookies,
    changeColor,
} from './module/main';
import {
    addEventListener,
    getCookie,
    getById,
    getBody,
    redirect,
    setTitle,
    deleteCookie,
    hideElement,
    showElement,
} from './module/dom';
import * as LocalMessageParam from './module/type/LocalMessageParam';

export default function () {
    clearCookies();

    let paramCookie = getCookie('local-message-param');
    const titleElem = getById('title');
    const messageElem = getById('message');

    if (paramCookie === null) {
        if (DEVELOPMENT) {
            changeColor(titleElem, 'orange');
            titleElem.innerHTML = 'タイトルTitle';
            messageElem.innerHTML = 'メッセージMessage'.repeat(10);
            showElement(getBody());
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }

    let param: LocalMessageParam.LocalMessageParam;
    try {
        paramCookie = decodeURIComponent(paramCookie);
        param = JSON.parse(paramCookie);
        LocalMessageParam.check(param);
    } catch (e) {
        redirect(TOP_URL, true);
        return;
    }

    const callback = function () {
        setTitle(param.htmlTitle);
        titleElem.innerHTML = param.title;
        changeColor(titleElem, param.color);
        messageElem.innerHTML = param.message;
        const button = getById('button');
        if (param.url === null) {
            deleteCookie('local-message-param');
            hideElement(button);
        } else {
            const url = param.url;
            button.innerHTML = '次に進む';
            addEventListener(button, 'click', function () {
                deleteCookie('local-message-param');
                redirect(url, true);
            });
        }

        showElement(getBody());
    };

    if (param.logout === true) {
        logout(callback);
        return;
    }

    callback();
}