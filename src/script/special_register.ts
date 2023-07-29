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
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat, emailAlreadyRegistered, invitationClosed, invitationOnly } from './module/message/template/inline';

export default function () {
    clearCookies();

    const emailInput = getById('email') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;

    addEventListener(emailInput, 'keydown', function (event) {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });

    addEventListener(submitButton, 'click', function () {
        register();
    });

    showElement(getBody());

    async function register() {
        disableAllInputs(true);

        const warningElem = getById('warning');
        const email = emailInput.value;

        if (!EMAIL_REGEX.test(email)) {
            warningElem.innerHTML = invalidEmailFormat;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('send_invite.php', {
            callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = invalidEmailFormat;
                } else if (response == 'ALREADY REGISTERED') {
                    warningElem.innerHTML = emailAlreadyRegistered;
                } else if (response == 'CLOSED') {
                    warningElem.innerHTML = invitationClosed;
                } else if (response == 'NORMAL') {
                    warningElem.innerHTML = invitationOnly;
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
}