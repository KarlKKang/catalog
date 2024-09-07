import { UAParser } from 'ua-parser-js';
import { prependChild } from '../module/dom/node/prepend_child';
import { remove } from '../module/dom/node/remove';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { addEventListener } from '../module/event_listener/add';
import { SessionKey, type Sessions } from '../module/type/Sessions';
import { toLocalTimeString } from '../module/string/local_time';
import { buildHttpForm } from '../module/string/http_form/build';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import * as styles from '../../css/my_account.module.scss';
import { reauthenticationPrompt } from './auth_helper';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';
import { disableButton } from '../module/dom/element/button/disable';

export default function (sessions: Sessions, sessionsContainer: HTMLElement) {
    replaceChildren(sessionsContainer);
    for (const session of sessions) {
        const outerContainer = createDivElement();
        const innerContainer = createDivElement();
        appendChild(outerContainer, innerContainer);

        appendParagraph('場所：' + session[SessionKey.COUNTRY], innerContainer);

        const ipParagraph = createParagraphElement('IPアドレス：' + session[SessionKey.IP]);
        appendChild(innerContainer, ipParagraph);
        addClass(ipParagraph, styles.ip);

        const [browser, os] = parseBrowser(session[SessionKey.UA]);
        appendParagraph('ブラウザ：' + browser, innerContainer);
        appendParagraph('OS：' + os, innerContainer);

        appendParagraph('最初のログイン：' + toLocalTimeString(session[SessionKey.LOGIN_TIME], true, true), innerContainer);
        appendParagraph('最近のアクティビティ：' + toLocalTimeString(session[SessionKey.LAST_ACTIVE_TIME], true, true), innerContainer);

        const sessionID = session[SessionKey.ID];
        if (sessionID === undefined) {
            const thisDevicePrompt = createParagraphElement('※このデバイスです。');
            addClass(thisDevicePrompt, styles.warning);
            appendChild(innerContainer, thisDevicePrompt);
            prependChild(sessionsContainer, outerContainer);
        } else {
            const sessionWarningElem = createParagraphElement();
            addClass(sessionWarningElem, styles.warning);
            hideElement(sessionWarningElem);
            appendChild(innerContainer, sessionWarningElem);

            const sessionLogoutButton = createStyledButtonElement('ログアウト');
            appendChild(innerContainer, sessionLogoutButton);

            addEventListener(sessionLogoutButton, 'click', () => {
                logoutSession(sessionID, sessionLogoutButton, sessionWarningElem);
            });
            appendChild(sessionsContainer, outerContainer);
        }
    }
}

function parseBrowser(userAgent: string) {
    const ua = UAParser(userAgent);
    const UNKNOWN = '不明';
    let browser = ua.browser.name;
    if (browser === undefined) {
        browser = UNKNOWN;
    } else {
        const browserVer = ua.browser.version;
        if (browserVer !== undefined) {
            browser += ' ' + browserVer;
        }
    }
    let os = ua.os.name;
    if (os === undefined) {
        os = UNKNOWN;
    } else {
        const osVer = ua.os.version;
        if (osVer !== undefined) {
            os += ' ' + osVer;
        }
    }

    return [browser, os] as const;
}

function appendParagraph(text: string, container: HTMLElement) {
    const elem = createParagraphElement(text);
    appendChild(container, elem);
}

function logoutSession(sessionID: string, sessionLogoutButton: HTMLButtonElement, sessionWarningElem: HTMLDivElement) {
    const disableAllInputs = (disabled: boolean) => {
        disableButton(sessionLogoutButton, disabled);
    };
    disableAllInputs(true);

    hideElement(sessionWarningElem);
    changeColor(sessionWarningElem, CSS_COLOR.RED);

    reauthenticationPrompt(
        'logout_session',
        (response: string) => {
            if (response === 'DONE') {
                removeAllEventListeners(sessionLogoutButton);
                remove(sessionLogoutButton);
                changeColor(sessionWarningElem, CSS_COLOR.GREEN);
                replaceText(sessionWarningElem, 'ログアウトしました。');
            } else {
                showMessage(invalidResponse());
                return false;
            }
            showElement(sessionWarningElem);
            disableAllInputs(false);
            return true;
        },
        disableAllInputs,
        sessionWarningElem,
        buildHttpForm({ id: sessionID }),
    );
}
