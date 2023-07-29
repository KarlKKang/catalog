// JavaScript Document
import {
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    clearCookies,
    disableInput,
    EMAIL_REGEX
} from './module/main';
import {
    addEventListener,
    getById,
    getBody,
    showElement,
    replaceText,
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat, emailAlreadyRegistered, invitationClosed, invitationOnly } from './module/message/template/inline';

let emailInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function () {
    clearCookies();

    emailInput = getById('email') as HTMLInputElement;
    submitButton = getById('submit-button') as HTMLButtonElement;
    warningElem = getById('warning');

    addEventListener(emailInput, 'keydown', function (event) {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });

    addEventListener(submitButton, 'click', function () {
        register();
    });

    showElement(getBody());
}

async function register() {
    disableAllInputs(true);

    const email = emailInput.value;

    if (!EMAIL_REGEX.test(email)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('send_invite.php', {
        callback: function (response: string) {
            if (response == 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
            } else if (response == 'ALREADY REGISTERED') {
                replaceText(warningElem, emailAlreadyRegistered);
            } else if (response == 'CLOSED') {
                replaceText(warningElem, invitationClosed);
            } else if (response == 'NORMAL') {
                replaceText(warningElem, invitationOnly);
            } else if (response == 'DONE') {
                showMessage(emailSent(LOGIN_URL));
                return;
            } else {
                showMessage();
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        },
        content: 'special=1&receiver=' + encodeURIComponent(email),
        withCredentials: false
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(emailInput, disabled);
}