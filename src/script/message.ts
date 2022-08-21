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
import { LocalMessageParam } from './module/type';

addEventListener(w, 'load', function () {
    if (getHref() !== TOP_URL + '/message' && !DEVELOPMENT) {
        redirect(TOP_URL + '/message', true);
        return;
    }

    clearCookies();

    var paramCookie = getCookie('local-message-param');
    var titleElem = getById('title');
    var messageElem = getById('message');

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

    var parsedParam: any;
    try {
        paramCookie = decodeURIComponent(paramCookie);
        parsedParam = JSON.parse(paramCookie);
        LocalMessageParam.check(parsedParam);
    } catch (e) {
        redirect(TOP_URL, true)
        return;
    }

    var param = parsedParam as LocalMessageParam.LocalMessageParam;

    var callback = function () {
        setTitle(param.htmlTitle);
        titleElem.innerHTML = param.title;
        changeColor(titleElem, param.color);
        messageElem.innerHTML = param.message;
        var button = getById('button');
        if (param.url === null) {
            deleteCookie('local-message-param');
            addClass(button, 'hidden');
        } else {
            let url = param.url;
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