// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
} from './module/env/constant';
import {
    logout,
    clearCookies,
    cssVarWrapper,
    changeColor,
} from './module/main';
import {
    w,
    addEventListener,
    getCookie,
    getById,
    removeClass,
    getBody,
    redirect,
    setTitle,
    deleteCookie,
    addClass,
    getHref,
} from './module/DOM';
import * as LocalMessageParam from './module/type/LocalMessageParam';

addEventListener(w, 'load', function () {
    if (getHref() !== TOP_URL + '/message' && !DEVELOPMENT) {
        redirect(TOP_URL + '/message', true);
        return;
    }

    clearCookies();

    let paramCookie = getCookie('local-message-param');
    const titleElem = getById('title');
    const messageElem = getById('message');

    if (paramCookie === null) {
        if (DEVELOPMENT) {
            changeColor(titleElem, 'orange');
            titleElem.innerHTML = 'タイトルTitle';
            messageElem.innerHTML = 'メッセージMessageメッセージMessageメッセージMessageメッセージMessageメッセージMessage';
            removeClass(getBody(), "hidden");
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
        redirect(TOP_URL, true)
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
            addClass(button, 'hidden');
        } else {
            const url = param.url;
            button.innerHTML = '次に進む';
            addEventListener(button, 'click', function () {
                deleteCookie('local-message-param');
                redirect(url, true);
            })
        }

        removeClass(getBody(), "hidden");
    };

    cssVarWrapper();

    if (param.logout === true) {
        logout(callback);
        return;
    }

    callback();
});