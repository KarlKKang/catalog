// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
    LOGIN_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    authenticate,
    clearCookies,
    disableInput,
    EMAIL_REGEX
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    getDescendantsByTagAt,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat } from './module/message/template/inline';

addEventListener(w, 'load', function () {
    if (getHref() !== LOGIN_URL + '/request_password_reset' && !DEVELOPMENT) {
        redirect(LOGIN_URL + '/request_password_reset', true);
        return;
    }

    clearCookies();

    const emailInput = getById('email') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;

    addEventListener(emailInput, 'keydown', function (event) {
        if ((event as KeyboardEvent).key === "Enter") {
            submitRequest();
        }
    });

    addEventListener(submitButton, 'click', function () {
        submitRequest();
    });

    addEventListener(getDescendantsByTagAt(getById('go-back'), 'span', 0), 'click', function () {
        redirect(LOGIN_URL, true);
    });

    authenticate({
        successful:
            function () {
                redirect(TOP_URL, true);
            },
        failed:
            function () {
                removeClass(getBody(), "hidden");
            },
    });


    function submitRequest() {
        disableAllInputs(true);

        const warningElem = getById('warning');

        const email = emailInput.value;
        if (!EMAIL_REGEX.test(email)) {
            warningElem.innerHTML = invalidEmailFormat;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        sendServerRequest('send_password_reset.php', {
            callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = invalidEmailFormat;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(emailSent(LOGIN_URL));
                } else {
                    showMessage();
                }
            },
            content: "email=" + email,
            withCredentials: false
        })
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
    }
});