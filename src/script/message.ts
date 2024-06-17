import { logout } from './module/server';
import { clearSessionStorage, setTitle } from './module/dom/document';
import { appendText, createButtonElement, createDivElement, createParagraphElement } from './module/dom/create_element';
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
            const [container, titleElem, messageElem] = createElements(true);
            changeColor(titleElem, CSS_COLOR.ORANGE);
            appendText(titleElem, 'タイトルTitle');
            appendText(messageElem, 'メッセージMessage'.repeat(10));
            const button = createButtonElement('ボタンButton');
            horizontalCenter(button);
            appendChild(container, button);
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
        [MessageParamKey.REPLACE_BODY]: replaceBody,
        [MessageParamInternalKey.DOCUMENT_TITLE]: documentTitle
    } = messageParam;

    const callback = () => {
        showPage();

        const [container, titleElem, messageElem] = createElements(!replaceBody);
        setTitle(documentTitle);
        titleElem.innerHTML = title;
        changeColor(titleElem, color);
        messageElem.innerHTML = message;

        if (buttonText !== null) {
            const button = createButtonElement(buttonText);
            horizontalCenter(button);
            appendChild(container, button);
            addEventListener(button, 'click', () => {
                redirect(url, true);
            });
        }
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