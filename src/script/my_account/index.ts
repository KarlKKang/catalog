import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    addNavBar
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import {
    sendServerRequest,
    logout,
    ServerRequestOptionProp
} from '../module/server';
import {
    addEventListener,
    appendText,
    clearSessionStorage,
    appendChild,
    passwordStyling,
    body,
} from '../module/dom';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import * as AccountInfo from '../module/type/AccountInfo';
import * as Sessions from '../module/type/Sessions';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid, redirect } from '../module/global';
import { SharedBool, SharedButton, SharedElement, SharedInput, dereferenceSharedVars, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars, setSharedBool } from './shared_var';
import { updateMfaUI, disableAllInputs } from './helper';
import { basicImportPromise, importAll, mfaImportPromise } from './import_promise';
import { moduleImportError } from '../module/message/param';
import { changeColor, showElement } from '../module/style';
import { CSS_COLOR } from '../module/style/value';
import { addTimeout } from '../module/timer';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    addNavBar(NavBarPage.MY_ACCOUNT);
    const container = initializeSharedVars();

    let getSessionsStarted = false;
    const getSessions = () => {
        if (getSessionsStarted) {
            return;
        }
        getSessionsStarted = true;
        const sessionsModuleImport = import('./sessions');
        sendServerRequest('get_sessions', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                let parsedResponse: Sessions.Sessions;
                try {
                    parsedResponse = JSON.parse(response);
                    Sessions.check(parsedResponse);
                } catch (e) {
                    showMessage(invalidResponse());
                    return;
                }
                const currentPgid = pgid;
                getImport(sessionsModuleImport).then(({ default: showSessions }) => {
                    if (currentPgid === pgid) {
                        showSessions(parsedResponse);
                    }
                });
            }
        });
    };
    addTimeout(getSessions, 1000); // In case the network latency is high, we might as well start the request early

    sendServerRequest('get_account', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            let parsedResponse: AccountInfo.AccountInfo;
            try {
                parsedResponse = JSON.parse(response);
                AccountInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }
            showPage();
            appendChild(body, container);
            showPageCallback(parsedResponse);
            getSessions();
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
    importAll();
}

function showPageCallback(userInfo: AccountInfo.AccountInfo) {
    const currentPgid = pgid;
    setSharedBool(SharedBool.currentLoginNotificationStatus, userInfo.login_notification);
    updateMfaUI(userInfo.mfa_status);

    addEventListener(getSharedButton(SharedButton.emailChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeEmail }) => {
            if (currentPgid === pgid) {
                changeEmail();
            }
        });
    });
    addEventListener(getSharedButton(SharedButton.usernameChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeUsername }) => {
            if (currentPgid === pgid) {
                changeUsername(userInfo);
            }
        });
    });
    addEventListener(getSharedButton(SharedButton.passwordChangeButton), 'click', () => {
        getImport(basicImportPromise).then(({ changePassword }) => {
            if (currentPgid === pgid) {
                changePassword();
            }
        });
    });
    addEventListener(getSharedButton(SharedButton.mfaButton), 'click', () => {
        if (getSharedBool(SharedBool.currentMfaStatus)) {
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
    addEventListener(getSharedButton(SharedButton.recoveryCodeButton), 'click', () => {
        getImport(mfaImportPromise).then(({ generateRecoveryCode }) => {
            if (currentPgid === pgid) {
                generateRecoveryCode();
            }
        });
    });
    addEventListener(getSharedButton(SharedButton.inviteButton), 'click', () => {
        getImport(basicImportPromise).then(({ invite }) => {
            if (currentPgid === pgid) {
                invite();
            }
        });
    });
    addEventListener(getSharedButton(SharedButton.logoutButton), 'click', () => {
        disableAllInputs(true);
        logout(() => {
            redirect(LOGIN_URL);
        });
    });
    addEventListener(getSharedButton(SharedButton.loginNotificationButton), 'click', () => {
        getImport(basicImportPromise).then(({ changeLoginNotification }) => {
            if (currentPgid === pgid) {
                changeLoginNotification();
            }
        });
    });

    passwordStyling(getSharedInput(SharedInput.newPasswordInput));
    passwordStyling(getSharedInput(SharedInput.newPasswordComfirmInput));

    if (userInfo.mfa_status) {
        const recoveryCodeInfo = getSharedElement(SharedElement.recoveryCodeInfo);
        if (userInfo.recovery_code_status === 0) {
            changeColor(recoveryCodeInfo, CSS_COLOR.RED);
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo.recovery_code_status === 1) {
            changeColor(recoveryCodeInfo, CSS_COLOR.ORANGE);
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SharedElement.inviteCount), userInfo.invite_quota.toString());
    getSharedInput(SharedInput.newUsernameInput).value = userInfo.username;
}

async function getImport<T>(importPromise: Promise<T>) {
    const currentPgid = pgid;
    try {
        return await importPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError);
        }
        throw e;
    }
}

export function offload() {
    dereferenceSharedVars();
}