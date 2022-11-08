import {
    DEVELOPMENT,
    TOP_URL,
    LOGIN_URL
} from '../env/constant';
import { getHref, redirect, setCookie, getTitle } from '../DOM/document';
import type { LocalMessageParam } from '../type/LocalMessageParam';

import { defaultError } from './template/title';
import { unknownError } from './template/body';


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

    param.title = param.title ?? defaultError;
    param.message = param.message ?? unknownError;
    param.color = param.color ?? 'red';
    param.logout = param.logout ?? false;
    param.url = param.url ?? null;

    const cookie: LocalMessageParam = {
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