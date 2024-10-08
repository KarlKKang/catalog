import { setTitle } from './module/dom/document/title/set';
import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createDivElement } from './module/dom/element/div/create';
import { appendChild } from './module/dom/node/append_child';
import { appendChildren } from './module/dom/node/append_children';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener/add';
import { type ShowPageFunc } from './module/global/type';
import { redirect } from './module/global/redirect';
import { pgid } from './module/global/pgid';
import * as styles from '../css/message.module.scss';
import { horizontalCenter } from './module/style/horizontal_center';
import { changeColor, CSS_COLOR } from './module/style/color';
import { MessageParamKey } from './module/message/type';
import { TOP_URI } from './module/env/uri';
import { MessageParamInternalKey, getMessageParam } from './module/message';
import { importModule } from './module/import_module';

export default function (showPage: ShowPageFunc) {
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
        [MessageParamInternalKey.DOCUMENT_TITLE]: documentTitle,
    } = messageParam;

    const callback = () => {
        showPage();
        createMessageElements(title, color, message, buttonText, url);
        setTitle(documentTitle);
    };

    if (logoutParam) {
        const currentPgid = pgid;
        importModule(
            () => import(
                /* webpackExports: ["logout"] */
                './module/server/logout'
            ),
        ).then(({ logout }) => {
            if (currentPgid === pgid) {
                logout(callback);
            }
        });
        return;
    }

    callback();
}

function createMessageElements(title: string, titleColor: CSS_COLOR, message: string | HTMLElement, buttonText: string | null, url: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const titleElem = createParagraphElement(title);
    addClass(titleElem, styles.title);
    changeColor(titleElem, titleColor);
    const messageElem = message instanceof HTMLElement ? message : createParagraphElement(message);
    addClass(messageElem, styles.body);
    appendChildren(container, titleElem, messageElem);

    if (buttonText !== null) {
        const button = createStyledButtonElement(buttonText);
        horizontalCenter(button);
        appendChild(container, button);
        addEventListener(button, 'click', () => {
            redirect(url, true);
        });
    }
}
