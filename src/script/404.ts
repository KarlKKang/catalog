// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    addEventListener,
    getById,
    redirect,
    appendText,
    clearSessionStorage,
} from './module/dom';
import { notFound as notFoundTitle } from './module/message/template/title/server';
import { notFound as notFoundBody } from './module/message/template/body/server';
import type { HTMLImport } from './module/type/HTMLImport';
import { showPage } from './module/common';

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();
    showPage(styleImportPromises, htmlImportPromises, () => {
        appendText(getById('title'), notFoundTitle);
        appendText(getById('message'), notFoundBody);
        addEventListener(getById('button'), 'click', () => {
            redirect(TOP_URL);
        });
    });
}