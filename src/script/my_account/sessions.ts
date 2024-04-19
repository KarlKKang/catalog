import { UAParser } from 'ua-parser-js';
import { addClass, appendChild, prependChild, remove, replaceChildren } from '../module/dom/element';
import { createButtonElement, createDivElement, createParagraphElement, replaceText } from '../module/dom/create_element';
import { addEventListener } from '../module/event_listener';
import { SessionKey, type Sessions } from '../module/type/Sessions';
import { SharedElement, getSharedElement, sessionLogoutButtons } from './shared_var';
import { getLocalTimeString } from '../module/common/pure';
import { changeColor, hideElement, showElement } from '../module/style';
import * as styles from '../../css/my_account.module.scss';
import { disableAllInputs } from './helper';
import { CSS_COLOR } from '../module/style/value';
import { reauthenticationPrompt } from './auth_helper';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';

export default function (sessions: Sessions) {
    const sessionsContainer = getSharedElement(SharedElement.sessionsContainer);
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

        appendParagraph('最初のログイン：' + getLocalTimeString(session[SessionKey.LOGIN_TIME], true, true), innerContainer);
        appendParagraph('最近のアクティビティ：' + getLocalTimeString(session[SessionKey.LAST_ACTIVE_TIME], true, true), innerContainer);

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

            const sessionLogoutButton = createButtonElement('ログアウト');
            appendChild(innerContainer, sessionLogoutButton);
            sessionLogoutButtons.add(sessionLogoutButton);

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
    disableAllInputs(true);
    hideElement(sessionWarningElem);
    changeColor(sessionWarningElem, CSS_COLOR.RED);
    reauthenticationPrompt(
        'logout_session',
        (response: string) => {
            if (response === 'DONE') {
                remove(sessionLogoutButton);
                sessionLogoutButtons.delete(sessionLogoutButton);
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
        sessionWarningElem,
        'id=' + sessionID,
    );
}