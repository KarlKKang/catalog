// JavaScript Document
import {
    DEVELOPMENT,
    LOGIN_URL,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    passwordStyling,
    disableInput,
    EMAIL_REGEX,
    PASSWORD_REGEX,
    hashPassword,
} from './module/main';
import {
    addEventListener,
    redirect,
    showElement,
    getBody,
    getById,
    replaceChildren,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, emailChanged, emailAlreadyRegistered } from './module/message/template/param';
import { loginFailed, accountDeactivated } from './module/message/template/inline';

let emailInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    emailInput = getById('email') as HTMLInputElement;
    passwordInput = getById('password') as HTMLInputElement;
    submitButton = getById('submit-button') as HTMLButtonElement;
    warningElem = getById('warning');

    const param = getURLParam('p');
    const keyID = getURLParam('key-id');
    const signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showElement(getBody());
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }
    if (keyID == null || !/^[a-zA-Z0-9~_-]+$/.test(keyID)) {
        redirect(TOP_URL, true);
        return;
    }
    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('change_email.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'DUPLICATED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'APPROVED') {
                addEventListener(emailInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        changeEmail(param, keyID, signature);
                    }
                });
                addEventListener(passwordInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        changeEmail(param, keyID, signature);
                    }
                });
                addEventListener(submitButton, 'click', function () {
                    changeEmail(param, keyID, signature);
                });

                passwordStyling(passwordInput);
                showElement(getBody());
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&key-id=' + keyID + '&signature=' + signature,
        withCredentials: false
    });
}

async function changeEmail(param: string, keyID: string, signature: string) {
    disableAllInputs(true);

    const email = emailInput.value;
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

    const user = {
        email: email,
        password: password,
    };

    const userString = JSON.stringify(user);

    sendServerRequest('change_email.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'DUPLICATED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'FAILED') {
                replaceText(warningElem, loginFailed);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DEACTIVATED') {
                replaceChildren(warningElem, ...accountDeactivated());
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DONE') {
                showMessage(emailChanged);
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&key-id=' + keyID + '&signature=' + signature + '&user=' + userString,
        withCredentials: false
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(emailInput, disabled);
    disableInput(passwordInput, disabled);
}