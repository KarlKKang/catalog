import {
    TOP_URL,
} from './module/env/constant';
import { clearSessionStorage } from './module/dom/document';
import { createButtonElement, createDivElement, createParagraphElement } from './module/dom/create_element';
import { addClass, appendChild } from './module/dom/element';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { notFound as notFoundTitle } from './module/server/message/title';
import { notFound as notFoundBody } from './module/server/message/body';
import { redirect, type ShowPageFunc } from './module/global';
import { changeColor, horizontalCenter, setWidth } from './module/style';
import { CSS_AUTO, CSS_COLOR } from './module/style/value';
import * as styles from '../css/message.module.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage();

    const container = createDivElement();
    addClass(container, styles.container);

    const title = createParagraphElement(notFoundTitle);
    addClass(title, styles.title);
    changeColor(title, CSS_COLOR.RED);
    appendChild(container, title);

    const messageBody = createParagraphElement(notFoundBody);
    addClass(messageBody, styles.body);
    appendChild(container, messageBody);

    const button = createButtonElement('トップページへ戻る');
    horizontalCenter(button);
    setWidth(button, CSS_AUTO);
    addEventListener(button, 'click', () => {
        redirect(TOP_URL);
    });
    appendChild(container, button);

    appendChild(body, container);
}