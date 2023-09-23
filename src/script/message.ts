// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    logout,
    changeColor,
} from './module/common';
import {
    addEventListener,
    getById,
    setTitle,
    hideElement,
    appendText,
    getSessionStorage,
    clearSessionStorage,
    insertBefore,
    remove,
    createDivElement,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
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
                const titleElem = getById('title');
                const messageElem = getById('message');
                changeColor(titleElem, 'orange');
                appendText(titleElem, 'タイトルTitle');
                appendText(messageElem, 'メッセージMessage'.repeat(10));
            });
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }

    const callback = () => {
        showPage(() => {
            const titleElem = getById('title');
            const messageElem = getById('message');

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
                    redirect(url, true);
                });
            }
        });
    };

    if (logoutParam) {
        logout(redirect, callback);
        return;
    }

    callback();
}