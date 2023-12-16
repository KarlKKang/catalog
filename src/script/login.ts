import {
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    passwordStyling,
    authenticate,
    disableInput,
    getURLParam,
    handleFailedTotp,
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
import { popupWindowImport, promptForTotpImport } from './module/popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import type { TotpPopupWindow } from './module/popup_window/totp';

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
            callback: function (response: string) {
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
                    case 'APPROVED':
                        if (UNRECOMMENDED_BROWSER) {
                            showMessage(unrecommendedBrowser(getForwardURL()));
                        } else {
                            redirect(getForwardURL(), true);
                        }
                        break;
                    default:
                        showMessage();
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