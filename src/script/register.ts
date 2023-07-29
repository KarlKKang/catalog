// JavaScript Document
import {
    DEVELOPMENT,
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
    sendServerRequest,
    passwordStyling,
    clearCookies,
    hashPassword,
    disableInput,
    PASSWORD_REGEX,
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
    getBody,
    getByClassAt,
    openWindow,
    showElement,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, registerComplete, emailAlreadyRegistered } from './module/message/template/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameTaken } from './module/message/template/inline';

let submitButton: HTMLButtonElement;
let usernameInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let passwordConfirmInput: HTMLInputElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    submitButton = getById('submit-button') as HTMLButtonElement;
    usernameInput = getById('username') as HTMLInputElement;
    passwordInput = getById('password') as HTMLInputElement;
    passwordConfirmInput = getById('password-confirm') as HTMLInputElement;
    warningElem = getById('warning');

    const param = getURLParam('p');
    const keyID = getURLParam('key-id');
    const signature = getURLParam('signature');

    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showElement(getBody());
            addInfoRedirects();
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (keyID === null || !/^[a-zA-Z0-9~_-]+$/.test(keyID)) {
        redirect(LOGIN_URL, true);
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
            } else if (response == 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'APPROVED') {
                addEventListener(usernameInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        register(param, keyID, signature);
                    }
                });
                addEventListener(passwordInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        register(param, keyID, signature);
                    }
                });
                addEventListener(passwordConfirmInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        register(param, keyID, signature);
                    }
                });


                addInfoRedirects();
                addEventListener(submitButton, 'click', function () {
                    register(param, keyID, signature);
                });

                passwordStyling(passwordInput);
                passwordStyling(passwordConfirmInput);

                showElement(getBody());
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&key-id=' + keyID + '&signature=' + signature,
        withCredentials: false
    });
}

async function register(param: string, keyID: string, signature: string) {
    disableAllInputs(true);

    const username = usernameInput.value;
    let password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (username == '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    if (!PASSWORD_REGEX.test(password)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (password != passwordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    password = await hashPassword(password);

    const user = {
        username: username,
        password: password
    };

    sendServerRequest('register.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'USERNAME DUPLICATED') {
                replaceText(warningElem, usernameTaken);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'USERNAME EMPTY') {
                replaceText(warningElem, usernameEmpty);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'DONE') {
                showMessage(registerComplete);
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&key-id=' + keyID + '&signature=' + signature + '&user=' + encodeURIComponent(JSON.stringify(user)),
        withCredentials: false
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(usernameInput, disabled);
    disableInput(passwordInput, disabled);
    disableInput(passwordConfirmInput, disabled);
}

function addInfoRedirects() {
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
}