import { clearSessionStorage } from './module/session_storage/clear';
import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createDivElement } from './module/dom/element/div/create';
import { appendChild } from './module/dom/node/append_child';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { redirect, type ShowPageFunc } from './module/global';
import { horizontalCenter } from './module/style/horizontal_center';
import { setWidth } from './module/style/width';
import { changeColor, CSS_COLOR } from './module/style/color';
import { CSS_AUTO } from './module/style/value/auto';
import * as styles from '../css/message.module.scss';
import { TOP_URI } from './module/env/uri';
import { notFoundTitle } from './module/text/not_found/title';
import { notFoundBody } from './module/text/not_found/body';

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

    const button = createStyledButtonElement('トップページへ戻る');
    horizontalCenter(button);
    setWidth(button, CSS_AUTO);
    addEventListener(button, 'click', () => {
        redirect(TOP_URI);
    });
    appendChild(container, button);

    appendChild(body, container);
}
