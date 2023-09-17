// JavaScript Document
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
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
    getBody,
    getDescendantsByTagAt,
    showElement,
    replaceChildren,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { loginFailed, accountDeactivated, tooManyFailedLogin } from './module/message/template/inline';
import { unrecommendedBrowser } from './module/message/template/param';
import { UNRECOMMENDED_BROWSER } from './module/browser';
import { promptForTotp } from './module/pop_up_window';
import { EMAIL_REGEX, PASSWORD_REGEX } from './module/main/pure';

let submitButton: HTMLButtonElement;
let passwordInput: HTMLInputElement;
let usernameInput: HTMLInputElement;
let rememberMeInput: HTMLInputElement;
let warningElem: HTMLElement;

export default function () {
    clearSessionStorage();

    submitButton = getById('submit-button') as HTMLButtonElement;
    passwordInput = getById('current-password') as HTMLInputElement;
    usernameInput = getById('username') as HTMLInputElement;
    rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;
    warningElem = getById('warning');

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
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
                showElement(getBody());
            }
    });
}

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
                () => { disableAllInputs(false); }
            );
        }
    );
}

function sendLoginRequest(content: string, failedTotpCallback: () => void, closePopUpWindow?: () => void) {
    sendServerRequest('login', {
        callback: function (response: string) {
            if (response == 'FAILED') {
                closePopUpWindow?.();
                replaceText(warningElem, loginFailed);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DEACTIVATED') {
                closePopUpWindow?.();
                replaceChildren(warningElem, ...accountDeactivated());
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'TOO MANY REQUESTS') {
                closePopUpWindow?.();
                replaceText(warningElem, tooManyFailedLogin);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'FAILED TOTP') {
                failedTotpCallback();
            } else if (response == 'APPROVED') {
                if (UNRECOMMENDED_BROWSER) {
                    showMessage(unrecommendedBrowser(getForwardURL()));
                } else {
                    redirect(getForwardURL(), true);
                }
            } else {
                showMessage();
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