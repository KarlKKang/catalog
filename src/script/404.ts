import {
    TOP_URL,
} from './module/env/constant';
import {
    addEventListener,
    appendText,
    clearSessionStorage,
    createDivElement,
    createParagraphElement,
    createButtonElement,
    appendChild,
    getBody,
    addClass,
} from './module/dom';
import { notFound as notFoundTitle } from './module/message/template/title/server';
import { notFound as notFoundBody } from './module/message/template/body/server';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { changeColor } from './module/common';
import { redirect } from './module/global';
import { setWidth } from './module/style';
import { CSS_AUTO } from './module/style/value';
import * as styles from '../css/message.module.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage(() => {
        const container = createDivElement();
        addClass(container, styles.container);

        const title = createParagraphElement();
        addClass(title, styles.title);
        changeColor(title, 'red');
        appendText(title, notFoundTitle);
        appendChild(container, title);

        const messageBody = createParagraphElement();
        addClass(messageBody, styles.body);
        appendText(messageBody, notFoundBody);
        appendChild(container, messageBody);

        const button = createButtonElement('トップページへ戻る');
        addClass(button, 'hcenter', styles.button);
        setWidth(button, CSS_AUTO);
        addEventListener(button, 'click', () => {
            redirect(TOP_URL);
        });
        appendChild(container, button);

        appendChild(getBody(), container);
    });
}