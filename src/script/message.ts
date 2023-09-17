// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    logout,
    clearCookies,
    changeColor,
} from './module/main';
import {
    addEventListener,
    getById,
    getBody,
    redirect,
    setTitle,
    deleteCookie,
    hideElement,
    showElement,
    appendText,
    getSessionStorage,
    clearSessionStorage,
    insertBefore,
    remove,
    createDivElement,
} from './module/dom';

export default function () {
    clearCookies();

    const titleElem = getById('title');
    const messageElem = getById('message');

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
            changeColor(titleElem, 'orange');
            appendText(titleElem, 'タイトルTitle');
            appendText(messageElem, 'メッセージMessage'.repeat(10));
            showElement(getBody());
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }

    const callback = () => {
        setTitle(documentTitle);
        titleElem.innerHTML = title;
        changeColor(titleElem, color);
        if (replaceBody) {
            const container = createDivElement();
            messageElem.id = '';
            container.id = 'message';
            container.innerHTML = message;
            insertBefore(container, messageElem);
            remove(messageElem);
        } else {
            messageElem.innerHTML = message;
        }

        const button = getById('button');
        if (buttonText === null) {
            hideElement(button);
        } else {
            if (url === null) {
                redirect(TOP_URL, true);
                return;
            }
            appendText(button, buttonText);
            addEventListener(button, 'click', () => {
                deleteCookie('local-message-param');
                redirect(url, true);
            });
        }

        showElement(getBody());
    };

    if (logoutParam) {
        logout(callback);
        return;
    }

    callback();
}