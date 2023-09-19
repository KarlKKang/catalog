// JavaScript Document
import {
    sendServerRequest,
    disableInput,
    showPage,
} from './module/main';
import {
    addEventListener,
    getById,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat, emailAlreadyRegistered, invitationClosed, invitationOnly } from './module/message/template/inline';
import { EMAIL_REGEX } from './module/main/pure';
import type { HTMLImport } from './module/type/HTMLImport';

let emailInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();

    showPage(styleImportPromises, htmlImportPromises, () => {
        emailInput = getById('email') as HTMLInputElement;
        submitButton = getById('submit-button') as HTMLButtonElement;
        warningElem = getById('warning');

        addEventListener(emailInput, 'keydown', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                register();
            }
        });

        addEventListener(submitButton, 'click', () => {
            register();
        });
    });
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

    sendServerRequest('send_invite', {
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
                showMessage(emailSent(false));
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