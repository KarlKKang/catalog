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
    clearCookies,
    hashPassword,
    getURLParam,
    PASSWORD_REGEX,
    EMAIL_REGEX,
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
} from './module/dom';
import { show as showMessage } from './module/message';
import { loginFailed, accountDeactivated } from './module/message/template/inline';
import { unrecommendedBrowser } from './module/message/template/param';
import { UNRECOMMENDED_BROWSER } from './module/browser';

let submitButton: HTMLButtonElement;
let passwordInput: HTMLInputElement;
let usernameInput: HTMLInputElement;
let rememberMeInput: HTMLInputElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

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
                addEventListener(usernameInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        login(warningElem);
                    }
                });
                addEventListener(passwordInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        login(warningElem);
                    }
                });

                addEventListener(submitButton, 'click', function () {
                    login(warningElem);
                });
                addEventListener(getDescendantsByTagAt(getById('forgot-password'), 'span', 0), 'click', function () {
                    redirect(LOGIN_URL + '/request_password_reset', true);
                });
                passwordStyling(passwordInput);
                showElement(getBody());
            }
    });
}

async function login(warningElem: HTMLElement) {
    disableAllInputs(true);

    const email = usernameInput.value;
    let password = passwordInput.value;

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

    password = await hashPassword(password);

    const param = {
        email: email,
        password: password,
        remember_me: rememberMeInput.checked
    };

    const paramString = JSON.stringify(param);

    sendServerRequest('login.php', {
        callback: function (response: string) {
            if (response == 'FAILED') {
                replaceText(warningElem, loginFailed);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DEACTIVATED') {
                replaceChildren(warningElem, ...accountDeactivated());
                showElement(warningElem);
                disableAllInputs(false);
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
        content: 'p=' + encodeURIComponent(paramString)
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