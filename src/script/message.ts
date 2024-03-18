import {
    TOP_URL,
} from './module/env/constant';
import {
    logout,
    changeColor,
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
    getBody,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';

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
                button.id = 'button';
                addClass(button, 'hcenter');
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
                button.id = 'button';
                addClass(button, 'hcenter');
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
    container.id = 'container';
    const titleElem = createParagraphElement();
    titleElem.id = 'title';
    const messageElem = paragraphMessage ? createParagraphElement() : createDivElement();
    messageElem.id = 'message';
    appendChildren(container, titleElem, messageElem);
    appendChild(getBody(), container);
    return [container, titleElem, messageElem] as const;
}