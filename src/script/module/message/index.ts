import {
    LOGIN_URL,
    TOP_URL,
} from '../env/constant';
import { getTitle, setSessionStorage, getFullURL, getBaseURL } from '../dom/document';

import { defaultError } from './template/title';
import { unknownError } from './template/body';
import { MessageParam } from './template/comm';
import type { RedirectFunc } from '../type/RedirectFunc';

export function show(redirect: RedirectFunc, { message, title, color, url, buttonText, logout, replaceBody }: MessageParam = {}) {
    setSessionStorage('message', message ?? unknownError);
    setSessionStorage('title', title ?? defaultError);
    setSessionStorage('color', color ?? 'red');
    setSessionStorage('document-title', getTitle());

    if (buttonText !== null) {
        setSessionStorage('button-text', buttonText ?? '戻る');
        if (url === undefined) {
            setSessionStorage('url', getFullURL());
        } else {
            setSessionStorage('url', url);
        }
    }

    if (logout) {
        setSessionStorage('logout', '1');
    }
    if (replaceBody) {
        setSessionStorage('replace-body', '1');
    }

    if (getBaseURL().startsWith(LOGIN_URL)) {
        redirect(LOGIN_URL + '/message', true);
    } else {
        redirect(TOP_URL + '/message', true);
    }
}