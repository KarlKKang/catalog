import {
    DEVELOPMENT,
    TOP_URL,
    LOGIN_URL
} from '../env/constant';
import { getHref, redirect, setCookie, getTitle } from '../DOM/document';
import { LocalMessageParam } from '../type';

import { defaultError } from "./template/title";
import { unknownError } from "./template/body";


interface MessageParam {
    message?: string,
    title?: string,
    color?: string,
    logout?: boolean,
    url?: string | null
}

export function show(param?: MessageParam) {
    if (param === undefined) {
        param = {};
        const href = getHref();
        if (href == TOP_URL) {
            param.logout = true;
            param.url = LOGIN_URL;
        } else if (href != LOGIN_URL) {
            param.url = TOP_URL;
        }
    }

    if (param.title === undefined) {
        param.title = defaultError;
    }
    if (param.message === undefined) {
        param.message = unknownError;
    }
    if (param.color === undefined) {
        param.color = 'red';
    }
    if (param.logout === undefined) {
        param.logout = false;
    }
    if (param.url === undefined) {
        param.url = null;
    }

    const cookie: LocalMessageParam.LocalMessageParam = {
        message: param.message,
        title: param.title,
        color: param.color,
        logout: param.logout,
        url: param.url,
        htmlTitle: getTitle()
    };

    setCookie('local-message-param', JSON.stringify(cookie), 86400);
    redirect(DEVELOPMENT ? 'message.html' : (TOP_URL + '/message'), true);
}