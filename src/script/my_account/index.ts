import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    addNavBar,
    NAV_BAR_MY_ACCOUNT,
} from '../module/common';
import {
    sendServerRequest,
    logout
} from '../module/server';
import {
    addEventListener,
    appendText,
    clearSessionStorage,
    createDivElement,
    appendChild,
    addClass,
    createParagraphElement,
    prependChild,
    createButtonElement,
    replaceText,
    passwordStyling,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import * as AccountInfo from '../module/type/AccountInfo';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid, redirect } from '../module/global';
import { SHARED_VAR_IDX_CURRENT_MFA_STATUS, SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, SHARED_VAR_IDX_INVITE_BUTTON, SHARED_VAR_IDX_INVITE_COUNT, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGOUT_BUTTON, SHARED_VAR_IDX_MFA_BUTTON, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_SESSIONS_CONTAINER, SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON, dereferenceSharedVars, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars, sessionLogoutButtons, setCurrentLoginNotificationStatus } from './shared_var';
import { changeMfaStatus, disableAllInputs } from './helper';
import { getLocalTimeString } from '../module/common/pure';
import { basicImportPromise, importAll, mfaImportPromise, parseBrowserImportPromise } from './import_promise';
import { moduleImportError } from '../module/message/param';
import { changeColor, hideElement, showElement } from '../module/style';
import { loading } from '../module/text/ui';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    sendServerRequest('get_account', {
        callback: function (response: string) {
            let parsedResponse: AccountInfo.AccountInfo;
            try {
                parsedResponse = JSON.parse(response);
                AccountInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            showPage(() => { showPageCallback(parsedResponse); });
        }
    });
    importAll();
}

function showPageCallback(userInfo: AccountInfo.AccountInfo) {
    const currentPgid = pgid;
    initializeSharedVars();
    setCurrentLoginNotificationStatus(userInfo.login_notification);
    changeMfaStatus(userInfo.mfa_status);

    addEventListener(getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON), 'click', () => {
        getImport(basicImportPromise).then(({ changeEmail }) => {
            if (currentPgid === pgid) {
                changeEmail();
            }
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON), 'click', () => {
        getImport(basicImportPromise).then(({ changeUsername }) => {
            if (currentPgid === pgid) {
                changeUsername(userInfo);
            }
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON), 'click', () => {
        getImport(basicImportPromise).then(({ changePassword }) => {
            if (currentPgid === pgid) {
                changePassword();
            }
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_MFA_BUTTON), 'click', () => {
        if (getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS)) {
            getImport(mfaImportPromise).then(({ disableMfa }) => {
                if (currentPgid === pgid) {
                    disableMfa();
                }
            });
        } else {
            getImport(mfaImportPromise).then(({ enableMfa }) => {
                if (currentPgid === pgid) {
                    enableMfa();
                }
            });
        }
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON), 'click', () => {
        getImport(mfaImportPromise).then(({ generateRecoveryCode }) => {
            if (currentPgid === pgid) {
                generateRecoveryCode();
            }
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_INVITE_BUTTON), 'click', () => {
        getImport(basicImportPromise).then(({ invite }) => {
            if (currentPgid === pgid) {
                invite();
            }
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_LOGOUT_BUTTON), 'click', () => {
        disableAllInputs(true);
        logout(() => {
            redirect(LOGIN_URL);
        });
    });
    addEventListener(getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON), 'click', () => {
        getImport(basicImportPromise).then(({ changeLoginNotification }) => {
            if (currentPgid === pgid) {
                changeLoginNotification();
            }
        });
    });

    passwordStyling(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT));
    passwordStyling(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT));

    if (userInfo.mfa_status) {
        const recoveryCodeInfo = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO);
        if (userInfo.recovery_code_status === 0) {
            changeColor(recoveryCodeInfo, 'red');
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo.recovery_code_status === 1) {
            changeColor(recoveryCodeInfo, 'orange');
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SHARED_VAR_IDX_INVITE_COUNT), userInfo.invite_quota.toString());
    getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT).value = userInfo.username;
    showSessions(userInfo);
    addNavBar(NAV_BAR_MY_ACCOUNT);
}

function showSessions(userInfo: AccountInfo.AccountInfo) {
    for (const session of userInfo.sessions) {
        const outerContainer = createDivElement();
        const innerContainer = createDivElement();
        appendChild(outerContainer, innerContainer);

        appendParagraph('場所：' + session.country, innerContainer);
        appendParagraph('IPアドレス：' + session.ip, innerContainer);

        const browserTextElem = appendParagraph('ブラウザ：' + loading, innerContainer);
        const osTextElem = appendParagraph('OS：' + loading, innerContainer);
        getImport(parseBrowserImportPromise).then(({ default: parseBrowser }) => {
            const [browser, os] = parseBrowser(session.ua);
            replaceText(browserTextElem, 'ブラウザ：' + browser);
            replaceText(osTextElem, 'OS：' + os);
        });

        appendParagraph('最初のログイン：' + getLocalTimeString(session.login_time, true, true), innerContainer);
        appendParagraph('最近のアクティビティ：' + getLocalTimeString(session.last_active_time, true, true), innerContainer);

        const sessionID = session.id;
        const sessionsContainer = getSharedElement(SHARED_VAR_IDX_SESSIONS_CONTAINER);
        if (sessionID === undefined) {
            const thisDevicePrompt = createParagraphElement('※このデバイスです。');
            addClass(thisDevicePrompt, 'warning');
            appendChild(innerContainer, thisDevicePrompt);
            prependChild(sessionsContainer, outerContainer);
        } else {
            const sessionWarningElem = createParagraphElement();
            addClass(sessionWarningElem, 'warning');
            hideElement(sessionWarningElem);
            appendChild(innerContainer, sessionWarningElem);

            const sessionLogoutButton = createButtonElement('ログアウト');
            appendChild(innerContainer, sessionLogoutButton);
            sessionLogoutButtons.add(sessionLogoutButton);

            addEventListener(sessionLogoutButton, 'click', () => {
                const currentPgid = pgid;
                getImport(basicImportPromise).then(({ logoutSession }) => {
                    if (currentPgid === pgid) {
                        logoutSession(sessionID, sessionLogoutButton, sessionWarningElem);
                    }
                });
            });
            appendChild(sessionsContainer, outerContainer);
        }
    }
}

function appendParagraph(text: string, container: HTMLElement) {
    const elem = createParagraphElement(text);
    appendChild(container, elem);
    return elem;
}

async function getImport<T>(importPromise: Promise<T>) {
    const currentPgid = pgid;
    try {
        return await importPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
}

export function offload() {
    dereferenceSharedVars();
}