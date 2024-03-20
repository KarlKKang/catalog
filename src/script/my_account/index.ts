import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    addNavBar
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
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
import { SharedBoolVarsIdx, SharedButtonVarsIdx, SharedElementVarsIdx, SharedInputVarsIdx, dereferenceSharedVars, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars, sessionLogoutButtons, setCurrentLoginNotificationStatus } from './shared_var';
import { changeMfaStatus, disableAllInputs } from './helper';
import { getLocalTimeString } from '../module/common/pure';
import { basicImportPromise, importAll, mfaImportPromise, parseBrowserImportPromise } from './import_promise';
import { moduleImportError } from '../module/message/param';
import { changeColor, hideElement, showElement } from '../module/style';
import { loading } from '../module/text/ui';

import '../../font/dist/NotoSansTC/NotoSansTC-Light.css';
import '../../font/dist/NotoSansSC/NotoSansSC-Light.css';
import '../../font/dist/NotoSans/NotoSans-Light.css';
import '../../font/dist/CourierNew/CourierNew-Regular.css';
import '../../css/my_account.scss';

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
            showPage();
            showPageCallback(parsedResponse);
        }
    });
    importAll();
}

function showPageCallback(userInfo: AccountInfo.AccountInfo) {
    const currentPgid = pgid;
    initializeSharedVars();
    setCurrentLoginNotificationStatus(userInfo.login_notification);
    changeMfaStatus(userInfo.mfa_status);

    addEventListener(getSharedButton(SharedButtonVarsIdx.emailChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeEmail }) => {
            if (currentPgid === pgid) {
                changeEmail();
            }
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.usernameChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeUsername }) => {
            if (currentPgid === pgid) {
                changeUsername(userInfo);
            }
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.passwordChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changePassword }) => {
            if (currentPgid === pgid) {
                changePassword();
            }
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.mfaButton), 'click', () => {
        if (getSharedBool(SharedBoolVarsIdx.currentMfaStatus)) {
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
    addEventListener(getSharedButton(SharedButtonVarsIdx.recoveryCodeButton), 'click', () => {
        getImport(mfaImportPromise).then(({ generateRecoveryCode }) => {
            if (currentPgid === pgid) {
                generateRecoveryCode();
            }
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.inviteButton), 'click', () => {
        getImport(basicImportPromise).then(({ invite }) => {
            if (currentPgid === pgid) {
                invite();
            }
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.logoutButton), 'click', () => {
        disableAllInputs(true);
        logout(() => {
            redirect(LOGIN_URL);
        });
    });
    addEventListener(getSharedButton(SharedButtonVarsIdx.loginNotificationButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeLoginNotification }) => {
            if (currentPgid === pgid) {
                changeLoginNotification();
            }
        });
    });

    passwordStyling(getSharedInput(SharedInputVarsIdx.newPasswordInput));
    passwordStyling(getSharedInput(SharedInputVarsIdx.newPasswordComfirmInput));

    if (userInfo.mfa_status) {
        const recoveryCodeInfo = getSharedElement(SharedElementVarsIdx.recoveryCodeInfo);
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

    appendText(getSharedElement(SharedElementVarsIdx.inviteCount), userInfo.invite_quota.toString());
    getSharedInput(SharedInputVarsIdx.newUsernameInput).value = userInfo.username;
    showSessions(userInfo);
    addNavBar(NavBarPage.MY_ACCOUNT);
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
        const sessionsContainer = getSharedElement(SharedElementVarsIdx.sessionsContainer);
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