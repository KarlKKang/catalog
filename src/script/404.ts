// JavaScript Document
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

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();
    showPage(() => {
        appendText(getById('title'), notFoundTitle);
        appendText(getById('message'), notFoundBody);
        const button = getById('button');
        button.style.width = 'auto';
        addEventListener(button, 'click', () => {
            redirect(TOP_URL);
        });
    });
}