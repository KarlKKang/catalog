import {
    TOP_URL,
    LOGIN_URL
} from '../env/constant';
import { getBaseURL, redirect, setCookie, getTitle } from '../dom/document';
import type { LocalMessageParam } from '../type/LocalMessageParam';

import { defaultError } from './template/title';
import { unknownError } from './template/body';


interface MessageParam {
    message?: string;
    title?: string;
    color?: string;
    url?: string | null;
}

export function show(param?: MessageParam) {
    let logout = false;
    if (param === undefined) {
        param = {};
        const href = getBaseURL();
        if (href == TOP_URL) {
            logout = true;
            param.url = LOGIN_URL;
        } else if (href != LOGIN_URL) {
            param.url = TOP_URL;
        }
    }

    param.title = param.title ?? defaultError;
    param.message = param.message ?? unknownError;
    param.color = param.color ?? 'red';
    param.url = param.url ?? null;

    const cookie: LocalMessageParam = {
        message: param.message,
        title: param.title,
        color: param.color,
        logout: logout,
        url: param.url,
        htmlTitle: getTitle()
    };

    setCookie('local-message-param', JSON.stringify(cookie), 86400);
    redirect(TOP_URL + '/message', true);
}