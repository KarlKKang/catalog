import {
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    disableInput,
} from './module/common';
import {
    addEventListener,
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
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import type { RedirectFunc } from './module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();
    showPage(() => { showPageCallback(redirect); });
}

function showPageCallback(redirect: RedirectFunc) {
    const emailInput = getById('email') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;
    const warningElem = getById('warning');

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

    function submitRequest() {
        disableAllInputs(true);

        const email = emailInput.value;
        if (!EMAIL_REGEX.test(email)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest(redirect, 'send_password_reset', {
            callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(redirect, emailSent(false));
                } else {
                    showMessage(redirect);
                }
            },
            content: 'email=' + encodeURIComponent(email),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
    }
}