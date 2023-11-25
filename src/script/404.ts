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
import { changeColor } from './module/common';
import { redirect } from './module/global';

export default function (showPage: ShowPageFunc) {
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