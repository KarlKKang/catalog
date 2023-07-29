// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT,
    TOP_DOMAIN,
    TOP_URL,
} from './module/env/constant';
import {
    w,
    addEventListener,
    getById,
    getBody,
    redirect,
    showElement,
    createDivElement,
    createParagraphElement,
    createButtonElement,
    appendChild,
    replaceChildren,
    setTitle,
    appendText,
} from './module/dom';
import { changeColor } from './module/main';

addEventListener(w, 'load', function () {
    setTitle('404 | ' + TOP_DOMAIN + DEVELOPMENT ? ' (alpha)' : '');

    const container = createDivElement();
    const title = createParagraphElement();
    const message = createParagraphElement();
    const button = createButtonElement();

    container.id = 'container';
    title.id = 'title';
    message.id = 'message';
    button.id = 'button';
    changeColor(title, 'red');

    appendText(title, 'ページが見つかりません');
    appendText(message, 'URLが間違っているか、ページが存在しません。ご確認の上、再度お試しください。');
    appendText(button, 'トップページへ戻る');

    appendChild(container, title);
    appendChild(container, message);
    appendChild(container, button);

    replaceChildren(getBody(), container);
    addEventListener(getById('button'), 'click', function () {
        redirect(TOP_URL);
    });
    showElement(getBody());
});