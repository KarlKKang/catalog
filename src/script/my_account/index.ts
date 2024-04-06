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
    ServerRequestOptionProp,
    parseResponse
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
import * as Sessions from '../module/type/Sessions';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { SharedBool, SharedButton, SharedElement, SharedInput, dereferenceSharedVars, getSharedBool, getSharedButton, getSharedElement, getSharedInput, initializeSharedVars, setSharedBool } from './shared_var';
import { updateMfaUI, disableAllInputs } from './helper';
import { basicImportPromise, importAll, mfaImportPromise } from './import_promise';
import { moduleImportError } from '../module/message/param';
import { changeColor, showElement } from '../module/style';
import { CSS_COLOR } from '../module/style/value';
import { addTimeout } from '../module/timer';
import { type AccountInfo, parseAccountInfo, AccountInfoKey } from '../module/type/AccountInfo';

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
                const currentPgid = pgid;
                getImport(sessionsModuleImport).then(({ default: showSessions }) => {
                    if (currentPgid === pgid) {
                        showSessions(parseResponse(response, Sessions.parseSession));
                    }
                });
            }
        });
    };
    addTimeout(getSessions, 1000); // In case the network latency is high, we might as well start the request early

    sendServerRequest('get_account', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            showPage();
            appendChild(body, container);
            showPageCallback(parseResponse(response, parseAccountInfo));
            getSessions();
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
    importAll();
}

function showPageCallback(userInfo: AccountInfo) {
    const currentPgid = pgid;
    setSharedBool(SharedBool.currentLoginNotificationStatus, userInfo[AccountInfoKey.LOGIN_NOTIFICATION]);
    updateMfaUI(userInfo[AccountInfoKey.MFA_STATUS]);

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

    if (userInfo[AccountInfoKey.MFA_STATUS]) {
        const recoveryCodeInfo = getSharedElement(SharedElement.recoveryCodeInfo);
        if (userInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 0) {
            changeColor(recoveryCodeInfo, CSS_COLOR.RED);
            appendText(recoveryCodeInfo, 'リカバリーコードが残っていません。新しいリカバリーコードを生成してください。');
            showElement(recoveryCodeInfo);
        } else if (userInfo[AccountInfoKey.RECOVERY_CODE_STATUS] === 1) {
            changeColor(recoveryCodeInfo, CSS_COLOR.ORANGE);
            appendText(recoveryCodeInfo, 'リカバリーコードが残りわずかです。新しいリカバリーコードを生成することをお勧めします。');
            showElement(recoveryCodeInfo);
        }
    }

    appendText(getSharedElement(SharedElement.inviteCount), userInfo[AccountInfoKey.INVITE_QUOTA].toString());
    getSharedInput(SharedInput.newUsernameInput).value = userInfo[AccountInfoKey.USERNAME];
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