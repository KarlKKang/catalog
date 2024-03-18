import {
    TOP_URL,
} from './module/env/constant';
import {
    logout,
} from './module/common';
import {
    addEventListener,
    setTitle,
    appendText,
    getSessionStorage,
    clearSessionStorage,
    createDivElement,
    createParagraphElement,
    appendChildren,
    createButtonElement,
    appendChild,
    addClass,
    body,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import * as styles from '../css/message.module.scss';
import { changeColor } from './module/style';

export default function (showPage: ShowPageFunc) {
    const message = getSessionStorage('message');
    const title = getSessionStorage('title');
    const color = getSessionStorage('color');
    const documentTitle = getSessionStorage('document-title');
    const buttonText = getSessionStorage('button-text');
    const url = getSessionStorage('url');
    const logoutParam = getSessionStorage('logout') === '1';
    const replaceBody = getSessionStorage('replace-body') === '1';

    clearSessionStorage();

    if (message === null || title === null || color === null || documentTitle === null) {
        if (DEVELOPMENT) {
            showPage(() => {
                const [container, titleElem, messageElem] = createElements(true);
                changeColor(titleElem, 'orange');
                appendText(titleElem, 'タイトルTitle');
                appendText(messageElem, 'メッセージMessage'.repeat(10));
                const button = createButtonElement('ボタンButton');
                addClass(button, 'hcenter', styles.button);
                appendChild(container, button);
            });
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }

    const callback = () => {
        showPage(() => {
            const [container, titleElem, messageElem] = createElements(!replaceBody);
            setTitle(documentTitle);
            titleElem.innerHTML = title;
            changeColor(titleElem, color);
            messageElem.innerHTML = message;

            if (buttonText !== null) {
                if (url === null) {
                    redirect(TOP_URL, true);
                    return;
                }
                const button = createButtonElement(buttonText);
                addClass(button, 'hcenter', styles.button);
                appendChild(container, button);
                addEventListener(button, 'click', () => {
                    redirect(url, true);
                });
            }
        });
    };

    if (logoutParam) {
        logout(callback);
        return;
    }

    callback();
}

function createElements(paragraphMessage: boolean) {
    const container = createDivElement();
    addClass(container, styles.container);
    const titleElem = createParagraphElement();
    addClass(titleElem, styles.title);
    const messageElem = paragraphMessage ? createParagraphElement() : createDivElement();
    addClass(messageElem, styles.body);
    appendChildren(container, titleElem, messageElem);
    appendChild(body, container);
    return [container, titleElem, messageElem] as const;
}