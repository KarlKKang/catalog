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

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage(() => {
        const container = createDivElement();
        container.id = 'container';

        const title = createParagraphElement();
        title.id = 'title';
        changeColor(title, 'red');
        appendText(title, notFoundTitle);
        appendChild(container, title);

        const messageBody = createParagraphElement();
        messageBody.id = 'message';
        appendText(messageBody, notFoundBody);
        appendChild(container, messageBody);

        const button = createButtonElement('トップページへ戻る');
        addClass(button, 'hcenter');
        setWidth(button, CSS_AUTO);
        addEventListener(button, 'click', () => {
            redirect(TOP_URL);
        });
        appendChild(container, button);

        appendChild(getBody(), container);
    });
}