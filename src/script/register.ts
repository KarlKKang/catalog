// JavaScript Document
import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
    sendServerRequest,
    passwordStyling,
    disableInput,
    showPage,
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
    getByClassAt,
    openWindow,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { expired, registerComplete, emailAlreadyRegistered } from './module/message/template/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameTaken } from './module/message/template/inline';
import { PASSWORD_REGEX } from './module/main/pure';
import type { HTMLImport } from './module/type/HTMLImport';

let submitButton: HTMLButtonElement;
let usernameInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let passwordConfirmInput: HTMLInputElement;
let warningElem: HTMLElement;

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();

    const param = getURLParam('p');
    const signature = getURLParam('signature');

    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage(styleImportPromises, htmlImportPromises, addInfoRedirects);
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    sendServerRequest('register', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response == 'APPROVED') {
                showPage(styleImportPromises, htmlImportPromises, () => {
                    submitButton = getById('submit-button') as HTMLButtonElement;
                    usernameInput = getById('username') as HTMLInputElement;
                    passwordInput = getById('password') as HTMLInputElement;
                    passwordConfirmInput = getById('password-confirm') as HTMLInputElement;
                    warningElem = getById('warning');

                    addEventListener(usernameInput, 'keydown', (event) => {
                        if ((event as KeyboardEvent).key === 'Enter') {
                            register(param, signature);
                        }
                    });
                    addEventListener(passwordInput, 'keydown', (event) => {
                        if ((event as KeyboardEvent).key === 'Enter') {
                            register(param, signature);
                        }
                    });
                    addEventListener(passwordConfirmInput, 'keydown', (event) => {
                        if ((event as KeyboardEvent).key === 'Enter') {
                            register(param, signature);
                        }
                    });


                    addInfoRedirects();
                    addEventListener(submitButton, 'click', () => {
                        register(param, signature);
                    });

                    passwordStyling(passwordInput);
                    passwordStyling(passwordConfirmInput);
                });
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

async function register(param: string, signature: string) {
    disableAllInputs(true);

    const username = usernameInput.value;
    const password = passwordInput.value;
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

    sendServerRequest('register', {
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
            } else if (response === 'PASSWORD INVALID') {
                replaceText(warningElem, invalidPasswordFormat);
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
        content: 'p=' + param + '&signature=' + signature + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
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
    addEventListener(getByClassAt('link', 0), 'click', () => {
        openWindow('info');
    });
    addEventListener(getByClassAt('link', 1), 'click', () => {
        openWindow('info#en');
    });
    addEventListener(getByClassAt('link', 2), 'click', () => {
        openWindow('info#zh-Hant');
    });
    addEventListener(getByClassAt('link', 3), 'click', () => {
        openWindow('info#zh-Hans');
    });
}