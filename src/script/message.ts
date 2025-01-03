import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createDivElement } from './module/dom/element/div/create';
import { appendChild } from './module/dom/node/append_child';
import { appendChildren } from './module/dom/node/append_children';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener/add';
import { type ShowPageFunc } from './module/global/type';
import { redirectSameOrigin } from './module/global/redirect';
import { pgid } from './module/global/pgid';
import * as styles from '../css/message.module.scss';
import { horizontalCenter } from './module/style/horizontal_center';
import { changeColor, CSS_COLOR } from './module/style/color';
import { MessageParamKey } from './module/message/type';
import { TOP_URI } from './module/env/uri';
import { getMessageParam } from './module/message';
import { importModule } from './module/import_module';
import { closeButtonText } from './module/text/button/close';
import { closeWindow } from './module/dom/window/close';
import { defaultErrorSuffix } from './module/text/default_error/suffix';
import { defaultErrorTitle } from './module/text/default_error/title';
import { getFullPath } from './module/dom/location/get/full_path';
import { goBackButtonText } from './module/text/button/go_back';

export default function (showPage: ShowPageFunc) {
    const messageParam = getMessageParam();
    if (messageParam === null) {
        if (DEVELOPMENT) {
            showPage();
            createMessageElements('タイトルTitle', CSS_COLOR.ORANGE, 'メッセージMessage'.repeat(10), 'ボタンButton', TOP_URI);
        } else {
            redirectSameOrigin(TOP_URI, true);
        }
        return;
    }

    const {
        [MessageParamKey.MESSAGE]: message,
        [MessageParamKey.TITLE]: title,
        [MessageParamKey.COLOR]: color,
        [MessageParamKey.URL]: url,
        [MessageParamKey.BUTTON]: button,
        [MessageParamKey.LOGOUT]: logoutParam,
    } = messageParam;

    const callback = () => {
        showPage();
        createMessageElements(title, color, message, button, url);
    };

    if (logoutParam) {
        const currentPgid = pgid;
        importModule(
            () => import(
                /* webpackExports: ["logout"] */
                './module/server/logout',
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

function createMessageElements(
    title: string | undefined,
    titleColor: CSS_COLOR | undefined,
    message: string | HTMLElement | undefined,
    button: string | HTMLButtonElement | null | undefined,
    url: string | undefined,
) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const titleElem = createParagraphElement(title ?? defaultErrorTitle);
    addClass(titleElem, styles.title);
    changeColor(titleElem, titleColor ?? CSS_COLOR.RED);
    const messageElem = message instanceof HTMLElement ? message : createParagraphElement(message ?? ('不明なエラーが発生しました。' + defaultErrorSuffix));
    addClass(messageElem, styles.body);
    appendChildren(container, titleElem, messageElem);

    if (button === null) {
        button = createStyledButtonElement(closeButtonText);
        addEventListener(button, 'click', () => {
            closeWindow();
        });
    } else {
        if (!(button instanceof HTMLElement)) {
            button = createStyledButtonElement(button ?? goBackButtonText);
        }
        addEventListener(button, 'click', () => {
            redirectSameOrigin(url ?? getFullPath(), true);
        });
    }
    horizontalCenter(button);
    appendChild(container, button);
}
