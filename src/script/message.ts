import { logout } from './module/server';
import { clearSessionStorage, setTitle } from './module/dom/document';
import { createButtonElement, createDivElement, createParagraphElement } from './module/dom/create_element';
import { addClass, appendChild, appendChildren } from './module/dom/element';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { redirect, type ShowPageFunc } from './module/global';
import * as styles from '../css/message.module.scss';
import { changeColor, horizontalCenter } from './module/style';
import { CSS_COLOR } from './module/style/value';
import { MessageParamKey } from './module/message/type';
import { TOP_URI } from './module/env/uri';
import { MessageParamInternalKey, getMessageParam } from './module/message';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const messageParam = getMessageParam();
    if (messageParam === null) {
        if (DEVELOPMENT) {
            showPage();
            createMessageElements('タイトルTitle', CSS_COLOR.ORANGE, 'メッセージMessage'.repeat(10), 'ボタンButton', TOP_URI);
        } else {
            redirect(TOP_URI, true);
        }
        return;
    }

    const {
        [MessageParamKey.MESSAGE]: message,
        [MessageParamKey.TITLE]: title,
        [MessageParamKey.COLOR]: color,
        [MessageParamKey.URL]: url,
        [MessageParamKey.BUTTON_TEXT]: buttonText,
        [MessageParamKey.LOGOUT]: logoutParam,
        [MessageParamInternalKey.DOCUMENT_TITLE]: documentTitle
    } = messageParam;

    const callback = () => {
        showPage();
        createMessageElements(title, color, message, buttonText, url);
        setTitle(documentTitle);
    };

    if (logoutParam) {
        logout(callback);
        return;
    }

    callback();
}

function createMessageElements(title: string, titleColor: CSS_COLOR, message: string | HTMLElement, buttonText: string | null, url: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const titleElem = createParagraphElement();
    addClass(titleElem, styles.title);
    titleElem.innerHTML = title;
    changeColor(titleElem, titleColor);
    const messageElem = message instanceof HTMLElement ? message : createParagraphElement(message);
    addClass(messageElem, styles.body);
    appendChildren(container, titleElem, messageElem);

    if (buttonText !== null) {
        const button = createButtonElement(buttonText);
        horizontalCenter(button);
        appendChild(container, button);
        addEventListener(button, 'click', () => {
            redirect(url, true);
        });
    }
}