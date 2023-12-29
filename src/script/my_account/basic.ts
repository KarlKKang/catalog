import {
    sendServerRequest,
    changeColor,
} from '../module/common';
import {
    addEventListener,
    showElement,
    hideElement,
    replaceText,
    appendChild,
    createParagraphElement,
    appendText,
    remove,
    createButtonElement,
    addClass,
    prependChild,
    createDivElement,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import {
    emailSent,
    emailChangeWait,
    invalidPasswordFormat,
    passwordConfirmationMismatch,
    passwordChanged,
    usernameChanged,
    usernameTaken,
    usernameEmpty,
    usernameUnchanged,
    invitationNotQualified,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    logoutDone,
} from '../module/message/template/inline';
import { SHARED_VAR_IDX_EMAIL_WARNING, SHARED_VAR_IDX_INVITE_COUNT, SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT, SHARED_VAR_IDX_INVITE_WARNING, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_WARNING, SHARED_VAR_IDX_SESSIONS_CONTAINER, SHARED_VAR_IDX_USERNAME_WARNING, getSharedElement, getSharedInput } from './shared_var';
import { disableAllInputs, reauthenticationPrompt } from './helper';
import { EMAIL_REGEX, PASSWORD_REGEX, getLocalTimeString } from '../module/common/pure';
import type { AccountInfo } from '../module/type/AccountInfo';
import { invalidResponse } from '../module/message/template/param/server';
import * as InviteResult from '../module/type/InviteResult';
import { UAParser } from 'ua-parser-js';

export function changeEmail() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_EMAIL_WARNING);

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    sendServerRequest('send_email_change', {
        callback: function (response: string) {
            if (response === 'WAIT') {
                replaceText(warningElem, emailChangeWait);
            } else if (response === 'DONE') {
                replaceText(warningElem, emailSent);
                changeColor(warningElem, 'green');
            } else {
                showMessage();
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        },
        showSessionEndedMessage: true,
    });
}

export function changePassword() {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_PASSWORD_WARNING);
    const newPasswordInput = getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT);
    const newPasswordComfirmInput = getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT);
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (!PASSWORD_REGEX.test(newPassword)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newPassword !== newPasswordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        'change_password',
        (response: string) => {
            if (response === 'DONE') {
                replaceText(warningElem, passwordChanged);
                changeColor(warningElem, 'green');
                newPasswordInput.value = '';
                newPasswordComfirmInput.value = '';
            } else if (response === 'PASSWORD INVALID') {
                replaceText(warningElem, invalidPasswordFormat);
            } else {
                showMessage();
                return false;
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'new=' + encodeURIComponent(newPassword),
    );
}

export function changeUsername(userInfo: AccountInfo) {
    disableAllInputs(true);

    const warningElem = getSharedElement(SHARED_VAR_IDX_USERNAME_WARNING);
    const newUsername = getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT).value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (newUsername === '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername === userInfo.username) {
        replaceText(warningElem, usernameUnchanged);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        'change_username',
        (response: string) => {
            if (response === 'DONE') {
                replaceText(warningElem, usernameChanged);
                changeColor(warningElem, 'green');
                userInfo.username = newUsername;
            } else if (response === 'DUPLICATED') {
                replaceText(warningElem, usernameTaken);
            } else if (response === 'EMPTY') {
                replaceText(warningElem, usernameEmpty);
            } else {
                showMessage();
                return false;
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'new=' + encodeURIComponent(newUsername),
    );
}

export function invite() {
    disableAllInputs(true);
    const inviteWarning = getSharedElement(SHARED_VAR_IDX_INVITE_WARNING);
    const inviteReceiverEmailInput = getSharedInput(SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT);
    const inviteCount = getSharedElement(SHARED_VAR_IDX_INVITE_COUNT);

    const warningElem = inviteWarning;
    const receiver = inviteReceiverEmailInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');
    if (!EMAIL_REGEX.test(receiver)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    reauthenticationPrompt(
        'send_invite',
        (response: string) => {
            if (response === 'NOT QUALIFIED') {
                replaceText(inviteCount, '0');
                replaceText(warningElem, invitationNotQualified);
            } else if (response === 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
            } else if (response === 'ALREADY REGISTERED') {
                replaceText(warningElem, emailAlreadyRegistered);
            } else if (response === 'CLOSED') {
                replaceText(warningElem, invitationClosed);
            } else {
                let parsedResponse: InviteResult.InviteResult;
                try {
                    parsedResponse = JSON.parse(response);
                    InviteResult.check(parsedResponse);
                } catch (e) {
                    showMessage(invalidResponse());
                    return false;
                }
                replaceText(inviteCount, parsedResponse.quota.toString());
                let message = emailSent;
                if (parsedResponse.special) {
                    message += '現在、一般登録を受け付けているため、招待券はかかりませんでした。';
                }
                replaceText(warningElem, message);
                changeColor(warningElem, 'green');
            }
            showElement(warningElem);
            disableAllInputs(false);
            return true;
        },
        warningElem,
        'receiver=' + encodeURIComponent(receiver),
    );
}

export function showSessions(userInfo: AccountInfo) {
    for (const session of userInfo.sessions) {
        const outerContainer = createDivElement();
        const innerContainer = createDivElement();
        appendChild(outerContainer, innerContainer);

        appendParagraph('場所：' + session.country, innerContainer);
        appendParagraph('IPアドレス：' + session.ip, innerContainer);

        const ua = UAParser(session.ua);
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
        appendParagraph('ブラウザ：' + browser, innerContainer);
        appendParagraph('OS：' + os, innerContainer);

        appendParagraph('最初のログイン：' + getLocalTimeString(session.login_time, true, true), innerContainer);
        appendParagraph('最近のアクティビティ：' + getLocalTimeString(session.last_active_time, true, true), innerContainer);

        const sessionID = session.id;
        const sessionsContainer = getSharedElement(SHARED_VAR_IDX_SESSIONS_CONTAINER);
        if (sessionID === undefined) {
            const thisDevicePrompt = createParagraphElement();
            addClass(thisDevicePrompt, 'warning');
            appendText(thisDevicePrompt, '※このデバイスです。');
            appendChild(innerContainer, thisDevicePrompt);
            prependChild(sessionsContainer, outerContainer);
        } else {
            const sessionWarningElem = createParagraphElement();
            addClass(sessionWarningElem, 'warning');
            hideElement(sessionWarningElem);
            appendChild(innerContainer, sessionWarningElem);

            const sessionLogoutButton = createButtonElement();
            addClass(sessionLogoutButton, 'button');
            appendText(sessionLogoutButton, 'ログアウト');
            appendChild(innerContainer, sessionLogoutButton);

            addEventListener(sessionLogoutButton, 'click', () => {
                hideElement(sessionWarningElem);
                changeColor(sessionWarningElem, 'red');
                reauthenticationPrompt(
                    'logout_session',
                    (response: string) => {
                        if (response === 'DONE') {
                            remove(sessionLogoutButton);
                            changeColor(sessionWarningElem, 'green');
                            replaceText(sessionWarningElem, logoutDone);
                        } else {
                            showMessage(invalidResponse());
                            return false;
                        }
                        showElement(sessionWarningElem);
                        return true;
                    },
                    sessionWarningElem,
                    'id=' + sessionID,
                );
            });
            appendChild(sessionsContainer, outerContainer);
        }
    }
}

function appendParagraph(text: string, container: HTMLElement) {
    const elem = createParagraphElement();
    appendText(elem, text);
    appendChild(container, elem);
}