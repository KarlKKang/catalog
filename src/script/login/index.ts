import {
    TOP_URL,
} from '../module/env/constant';
import {
    handleFailedTotp,
} from '../module/common';
import {
    sendServerRequest,
    authenticate
} from '../module/server_request';
import {
    addEventListener,
    getById,
    getDescendantsByTagAt,
    replaceChildren,
    replaceText,
    clearSessionStorage,
    passwordStyling,
    disableInput,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from '../module/message/template/inline';
import { moduleImportError } from '../module/message/template/param';
import { popupWindowImport, promptForTotpImport } from '../module/popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid, redirect } from '../module/global';
import type { TotpPopupWindow } from '../module/popup_window/totp';
import { invalidResponse } from '../module/message/template/param/server';
import { showElement } from '../module/style';

let onDemandImportPromise: Promise<typeof import(
    './on_demand'
)>;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                showPage(() => { showPageCallback(); });
            }
    });
    onDemandImportPromise = import('./on_demand');
}

function showPageCallback() {
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const passwordInput = getById('current-password') as HTMLInputElement;
    const usernameInput = getById('username') as HTMLInputElement;
    const rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;
    const warningElem = getById('warning');

    const popupWindowImportPromise = popupWindowImport();
    const promptForTotpImportPromise = promptForTotpImport();

    const loginOnKeyDown = (event: Event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            login();
        }
    };

    addEventListener(usernameInput, 'keydown', loginOnKeyDown);
    addEventListener(passwordInput, 'keydown', loginOnKeyDown);

    addEventListener(submitButton, 'click', login);
    addEventListener(getDescendantsByTagAt(getById('forgot-password'), 'span', 0), 'click', () => {
        redirect(TOP_URL + '/request_password_reset', true);
    });
    passwordStyling(passwordInput);

    function login() {
        disableAllInputs(true);

        const email = usernameInput.value;
        const password = passwordInput.value;

        if (!EMAIL_REGEX.test(email)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            replaceText(warningElem, loginFailed);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendLoginRequest('email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&remember_me=' + (rememberMeInput.checked ? '1' : '0'));
    }

    function sendLoginRequest(content: string, totpPopupWindow?: TotpPopupWindow) {
        sendServerRequest('login', {
            callback: async function (response: string) {
                switch (response) {
                    case AUTH_FAILED:
                        totpPopupWindow?.[2];
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_FAILED_TOTP:
                        handleFailedTotp(
                            popupWindowImportPromise,
                            promptForTotpImportPromise,
                            totpPopupWindow,
                            () => {
                                disableAllInputs(false);
                            },
                            () => {
                                disableAllInputs(false);
                                usernameInput.value = '';
                                passwordInput.value = '';
                                replaceText(warningElem, sessionEnded);
                                showElement(warningElem);
                            },
                            (totpPopupWindow: TotpPopupWindow) => {
                                sendLoginRequest(content, totpPopupWindow);
                            }
                        );
                        break;
                    case AUTH_DEACTIVATED:
                        totpPopupWindow?.[2];
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case AUTH_TOO_MANY_REQUESTS:
                        totpPopupWindow?.[2];
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                        break;
                    case 'APPROVED': {
                        const currentPgid = pgid;
                        let onDemandImport: Awaited<typeof onDemandImportPromise>;
                        try {
                            onDemandImport = await onDemandImportPromise;
                        } catch (e) {
                            if (currentPgid === pgid) {
                                showMessage(moduleImportError(e));
                            }
                            throw e;
                        }
                        if (currentPgid === pgid) {
                            onDemandImport.approvedCallback();
                        }
                        break;
                    }
                    default:
                        showMessage(invalidResponse());
                }
            },
            content: content + (totpPopupWindow === undefined ? '' : '&totp=' + totpPopupWindow[0]),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(passwordInput, disabled);
        disableInput(usernameInput, disabled);
        disableInput(rememberMeInput, disabled);
    }
}