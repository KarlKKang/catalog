import {
    TOP_URL,
} from './module/env/constant';
import {
    addEventListener,
    getById,
    appendText,
    clearSessionStorage,
} from './module/dom';
import { notFound as notFoundTitle } from './module/message/template/title/server';
import { notFound as notFoundBody } from './module/message/template/body/server';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';
import { changeColor } from './module/common';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();
    showPage(() => {
        const title = getById('title');
        changeColor(title, 'red');
        appendText(title, notFoundTitle);
        appendText(getById('message'), notFoundBody);
        const button = getById('button');
        appendText(button, 'トップページへ戻る');
        button.style.width = 'auto';
        addEventListener(button, 'click', () => {
            redirect(TOP_URL);
        });
    });
}