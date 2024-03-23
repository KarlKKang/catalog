import {
    TOP_URL,
} from './module/env/constant';
import {
    addEventListener,
    clearSessionStorage,
    createDivElement,
    createParagraphElement,
    createButtonElement,
    appendChild,
    addClass,
    body,
} from './module/dom';
import { notFound as notFoundTitle } from './module/server/message/title';
import { notFound as notFoundBody } from './module/server/message/body';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { changeColor, horizontalCenter, setWidth } from './module/style';
import { CSS_AUTO } from './module/style/value';
import * as styles from '../css/message.module.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage();

    const container = createDivElement();
    addClass(container, styles.container);

    const title = createParagraphElement(notFoundTitle);
    addClass(title, styles.title);
    changeColor(title, 'red');
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