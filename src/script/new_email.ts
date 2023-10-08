import {
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    disableInput,
} from './module/common';
import {
    addEventListener,
    getById,
    showElement,
    replaceText,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidEmailFormat, emailAlreadyRegistered } from './module/message/template/inline';
import { expired, emailSent } from './module/message/template/param';
import { EMAIL_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    const signature = getURLParam('signature');

    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage();
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }
    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(TOP_URL, true);
        return;
    }

    sendServerRequest(redirect, 'verify_email_change', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(redirect, expired);
            } else if (response == 'APPROVED') {
                showPage(() => { showPageCallback(redirect, param, signature); });
            } else {
                showMessage(redirect);
            }
        },
        content: 'p=' + param + '&signature=' + signature,
        withCredentials: false
    });
}

function showPageCallback(redirect: RedirectFunc, param: string, signature: string) {
    const newEmailInput = getById('new-email') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const warningElem = getById('warning');

    addEventListener(newEmailInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(submitButton, 'click', () => {
        submitRequest();
    });

    function submitRequest() {
        disableAllInputs(true);

        const newEmail = newEmailInput.value;

        if (!EMAIL_REGEX.test(newEmail)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest(redirect, 'verify_email_change', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(redirect, expired);
                } else if (response == 'DUPLICATED') {
                    replaceText(warningElem, emailAlreadyRegistered);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(redirect, emailSent(false));
                } else {
                    showMessage(redirect);
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
}