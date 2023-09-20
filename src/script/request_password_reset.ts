// JavaScript Document
import {
    TOP_URL,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    authenticate,
    disableInput,
    showPage,
} from './module/common';
import {
    addEventListener,
    redirect,
    getById,
    getDescendantsByTagAt,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat } from './module/message/template/inline';
import { EMAIL_REGEX } from './module/common/pure';
import type { HTMLImport } from './module/type/HTMLImport';

let emailInput: HTMLInputElement;
let submitButton: HTMLButtonElement;
let warningElem: HTMLElement;

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                showPage(styleImportPromises, htmlImportPromises, () => {
                    emailInput = getById('email') as HTMLInputElement;
                    submitButton = getById('submit-button') as HTMLButtonElement;
                    warningElem = getById('warning');

                    addEventListener(emailInput, 'keydown', (event) => {
                        if ((event as KeyboardEvent).key === 'Enter') {
                            submitRequest();
                        }
                    });

                    addEventListener(submitButton, 'click', () => {
                        submitRequest();
                    });

                    addEventListener(getDescendantsByTagAt(getById('go-back'), 'span', 0), 'click', () => {
                        redirect(LOGIN_URL, true);
                    });
                });
            },
    });
}

function submitRequest() {
    disableAllInputs(true);

    const email = emailInput.value;
    if (!EMAIL_REGEX.test(email)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('send_password_reset', {
        callback: function (response: string) {
            if (response == 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
                showElement(warningElem);
                disableAllInputs(false);
            } else if (response == 'DONE') {
                showMessage(emailSent(false));
            } else {
                showMessage();
            }
        },
        content: 'email=' + encodeURIComponent(email),
    });
}

function disableAllInputs(disabled: boolean) {
    submitButton.disabled = disabled;
    disableInput(emailInput, disabled);
}