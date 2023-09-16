// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    disableInput,
    EMAIL_REGEX,
} from './module/main';
import {
    addEventListener,
    redirect,
    getById,
    getBody,
    showElement,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidEmailFormat, emailAlreadyRegistered } from './module/message/template/inline';
import { expired, emailSent } from './module/message/template/param';

let newEmailInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    newEmailInput = getById('new-email') as HTMLInputElement;
    submitButton = getById('submit-button') as HTMLButtonElement;
    warningElem = getById('warning');

    const param = getURLParam('p');
    const signature = getURLParam('signature');


    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showElement(getBody());
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }
    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(TOP_URL, true);
        return;
    }

    sendServerRequest('verify_email_change', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'APPROVED') {
                addEventListener(newEmailInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === 'Enter') {
                        submitRequest(param, signature);
                    }
                });

                addEventListener(submitButton, 'click', function () {
                    submitRequest(param, signature);
                });
                showElement(getBody());
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function submitRequest(param: string, signature: string) {
    disableAllInputs(true);

    const newEmail = newEmailInput.value;

    if (!EMAIL_REGEX.test(newEmail)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('verify_email_change', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'DUPLICATED') {
                replaceText(warningElem, emailAlreadyRegistered);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DONE') {
                showMessage(emailSent(TOP_URL));
            } else {
                showMessage();
            }
        },
        content: 'p=' + param + '&signature=' + signature + '&new=' + newEmail,
        withCredentials: false
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(newEmailInput, disabled);
}