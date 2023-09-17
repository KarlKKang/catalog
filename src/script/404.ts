// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    addEventListener,
    getById,
    getBody,
    redirect,
    showElement,
    appendText,
    clearSessionStorage,
} from './module/dom';
import { notFound as notFoundTitle } from './module/message/template/title/server';
import { notFound as notFoundBody } from './module/message/template/body/server';

export default function () {
    clearSessionStorage();
    appendText(getById('title'), notFoundTitle);
    appendText(getById('message'), notFoundBody);
    addEventListener(getById('button'), 'click', () => {
        redirect(TOP_URL);
    });
    showElement(getBody());
}