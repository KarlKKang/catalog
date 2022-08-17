// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
    sendServerRequest,
    passwordStyling,
    clearCookies,
    cssVarWrapper,
    hashPassword,
    disableInput
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
    getByClassAt,
    openWindow,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { expired, registerComplete } from './module/message/template/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameTaken } from './module/message/template/inline';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (!getHref().startsWith('https://featherine.com/register') && !DEVELOPMENT) {
        redirect(LOGIN_URL, true);
        return;
    }

    var submitButton = getById('submit-button') as HTMLButtonElement;
    var usernameInput = getById('username') as HTMLInputElement;
    var passwordInput = getById('password') as HTMLInputElement;
    var passwordConfirmInput = getById('password-confirm') as HTMLInputElement;

    var param = getURLParam('p');
    var signature = getURLParam('signature');

    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            removeClass(getBody(), "hidden");
            addEventListener(getByClassAt('link', 0), 'click', function () {
                openWindow('info');
            });
            addEventListener(getByClassAt('link', 1), 'click', function () {
                openWindow('info#en');
            });
            addEventListener(getByClassAt('link', 2), 'click', function () {
                openWindow('info#zh-Hant');
            });
            addEventListener(getByClassAt('link', 3), 'click', function () {
                openWindow('info#zh-Hans');
            });
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('register.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'APPROVED') {
                addEventListener(usernameInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        register();
                    }
                });
                addEventListener(passwordInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        register();
                    }
                });
                addEventListener(passwordConfirmInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        register();
                    }
                });


                addEventListener(getByClassAt('link', 0), 'click', function () {
                    openWindow('info');
                });
                addEventListener(getByClassAt('link', 1), 'click', function () {
                    openWindow('info#en');
                });
                addEventListener(getByClassAt('link', 2), 'click', function () {
                    openWindow('info#zh-Hant');
                });
                addEventListener(getByClassAt('link', 3), 'click', function () {
                    openWindow('info#zh-Hans');
                });

                addEventListener(submitButton, 'click', function () {
                    register();
                });

                passwordStyling(passwordInput);
                passwordStyling(passwordConfirmInput);

                removeClass(getBody(), "hidden");
            } else {
                showMessage();
            }
        },
        content: "p=" + param + "&signature=" + signature,
        withCredentials: false
    });

    async function register() {
        disableAllInputs(true);

        var warningElem = getById('warning');

        var username = usernameInput.value;
        var password = passwordInput.value;
        var passwordConfirm = passwordConfirmInput.value;

        if (username == '') {
            warningElem.innerHTML = usernameEmpty;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        if (password == '' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,64}$/.test(password)) {
            warningElem.innerHTML = invalidPasswordFormat;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        } else if (password != passwordConfirm) {
            warningElem.innerHTML = passwordConfirmationMismatch;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        password = await hashPassword(password);

        var user = {
            username: username,
            password: password
        };

        sendServerRequest('register.php', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(expired);
                } else if (response == 'USERNAME DUPLICATED') {
                    warningElem.innerHTML = usernameTaken;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(registerComplete);
                } else {
                    showMessage();
                }
            },
            content: "p=" + param + "&signature=" + signature + "&user=" + encodeURIComponent(JSON.stringify(user)),
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(usernameInput, disabled);
        disableInput(passwordInput, disabled);
        disableInput(passwordConfirmInput, disabled);
    }
});