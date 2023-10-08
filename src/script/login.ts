import {
    TOP_URL,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    passwordStyling,
    authenticate,
    disableInput,
    getURLParam,
} from './module/common';
import {
    addEventListener,
    getById,
    getDescendantsByTagAt,
    showElement,
    replaceChildren,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin, sessionEnded } from './module/message/template/inline';
import { unrecommendedBrowser } from './module/message/template/param';
import { UNRECOMMENDED_BROWSER } from './module/browser';
import { destroy as destroyPopUpWindow, promptForTotp } from './module/pop_up_window';
import { EMAIL_REGEX, PASSWORD_REGEX, handleAuthenticationResult } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    authenticate(redirect, {
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                showPage(() => { showPageCallback(redirect); });
            }
    });
}

function showPageCallback(redirect: RedirectFunc) {
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const passwordInput = getById('current-password') as HTMLInputElement;
    const usernameInput = getById('username') as HTMLInputElement;
    const rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;
    const warningElem = getById('warning');

    const loginOnKeyDown = (event: Event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            login();
        }
    };

    addEventListener(usernameInput, 'keydown', loginOnKeyDown);
    addEventListener(passwordInput, 'keydown', loginOnKeyDown);

    addEventListener(submitButton, 'click', login);
    addEventListener(getDescendantsByTagAt(getById('forgot-password'), 'span', 0), 'click', () => {
        redirect(LOGIN_URL + '/request_password_reset', true);
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

        sendLoginRequest(
            'email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&remember_me=' + (rememberMeInput.checked ? '1' : '0'),
            () => {
                promptForTotp(
                    (totp, closeWindow, showWarning) => {
                        sendLoginRequest(
                            'email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&remember_me=' + (rememberMeInput.checked ? '1' : '0') + '&totp=' + totp,
                            showWarning,
                            closeWindow
                        );
                    },
                    () => { disableAllInputs(false); },
                    () => {
                        usernameInput.value = '';
                        passwordInput.value = '';
                        replaceText(warningElem, sessionEnded);
                        showElement(warningElem);
                    }
                );
            }
        );
    }

    function sendLoginRequest(content: string, failedTotpCallback: () => void, closePopUpWindow?: () => void) {
        sendServerRequest(redirect, 'login', {
            callback: function (response: string) {
                const authenticationResult = handleAuthenticationResult(
                    response,
                    () => {
                        closePopUpWindow?.();
                        replaceText(warningElem, loginFailed);
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                    failedTotpCallback,
                    () => {
                        closePopUpWindow?.();
                        replaceChildren(warningElem, ...accountDeactivated());
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                    () => {
                        closePopUpWindow?.();
                        replaceText(warningElem, tooManyFailedLogin);
                        showElement(warningElem);
                        disableAllInputs(false);
                    },
                );
                if (!authenticationResult) {
                    return;
                }

                if (response == 'APPROVED') {
                    if (UNRECOMMENDED_BROWSER) {
                        showMessage(redirect, unrecommendedBrowser(getForwardURL()));
                    } else {
                        redirect(getForwardURL(), true);
                    }
                } else {
                    showMessage(redirect);
                }
            },
            content: content
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(passwordInput, disabled);
        disableInput(usernameInput, disabled);
        disableInput(rememberMeInput, disabled);
    }

    function getForwardURL() {
        const series = getURLParam('series');
        if (series !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
            let url: string;
            let separator: '?' | '&' = '?';
            url = TOP_URL + '/bangumi/' + series;

            const ep = getURLParam('ep');
            if (ep !== null && ep !== '1') {
                url += separator + 'ep=' + ep;
                separator = '&';
            }

            const format = getURLParam('format');
            if (format !== null && format !== '1') {
                url += separator + 'format=' + format;
            }
            return url;
        }

        const news = getURLParam('news');
        if (news !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(news)) {
            const hash = getURLParam('hash');
            const hashString = (hash === null) ? '' : ('#' + hash);
            return TOP_URL + '/news/' + news + hashString;
        }

        const keywords = getURLParam('keywords');
        if (keywords !== null) {
            return TOP_URL + '?keywords=' + keywords;
        }

        return TOP_URL;
    }
}

export function offload() {
    destroyPopUpWindow();
}