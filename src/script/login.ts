// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
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
    checkBaseURL,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    getById,
    removeClass,
    getBody,
    getDescendantsByTagAt
} from './module/DOM';
import { show as showMessage } from './module/message';
import { loginFailed, accountDeactivated } from './module/message/template/inline';
import { unrecommendedBrowser } from './module/message/template/param';

addEventListener(w, 'load', function () {
    if (!checkBaseURL(LOGIN_URL) && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }

    clearCookies();

    const submitButton = getById('submit-button') as HTMLButtonElement;
    const passwordInput = getById('current-password') as HTMLInputElement;
    const usernameInput = getById('username') as HTMLInputElement;
    const rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                addEventListener(usernameInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        login();
                    }
                });
                addEventListener(passwordInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        login();
                    }
                })

                addEventListener(submitButton, 'click', function () {
                    login();
                });
                addEventListener(getDescendantsByTagAt(getById('forgot-password'), 'span', 0), 'click', function () {
                    redirect(DEVELOPMENT ? 'request_password_reset.html' : (LOGIN_URL + '/request_password_reset'), true);
                });
                passwordStyling(passwordInput);
                removeClass(getBody(), "hidden");
            }
    });

    async function login() {
        disableAllInputs(true);

        const warningElem = getById('warning');

        const email = usernameInput.value;
        let password = passwordInput.value;

        if (!EMAIL_REGEX.test(email)) {
            warningElem.innerHTML = loginFailed;
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            warningElem.innerHTML = loginFailed;
            removeClass(warningElem, 'hidden');
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
                    warningElem.innerHTML = loginFailed;
                    removeClass(warningElem, 'hidden');
                    disableAllInputs(false);
                } else if (response == 'DEACTIVATED') {
                    warningElem.innerHTML = accountDeactivated;
                    removeClass(warningElem, 'hidden');
                    disableAllInputs(false);
                } else if (response == 'NOT RECOMMENDED') {
                    setTimeout(function () {
                        showMessage(unrecommendedBrowser(getForwardURL()));
                    }, 500);
                } else if (response == 'APPROVED') {
                    setTimeout(function () {
                        redirect(getForwardURL(), true);
                    }, 500);
                } else {
                    showMessage();
                }
            },
            content: "p=" + encodeURIComponent(paramString)
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
            let separator: '?' | '&';

            if (DEVELOPMENT) {
                url = 'bangumi.html?series=' + series;
                separator = '&';
            } else {
                url = TOP_URL + '/bangumi/' + series;
                separator = '?';
            }

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
            if (DEVELOPMENT) {
                return 'news.html?id=' + news + hashString;
            } else {
                return TOP_URL + '/news/' + news + hashString;
            }
        }

        const keywords = getURLParam('keywords');
        if (keywords !== null) {
            return TOP_URL + '?keywords=' + keywords;
        }

        return TOP_URL;
    }
});