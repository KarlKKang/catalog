// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
} from './module/env/constant';
import {
    sendServerRequest,
    clearCookies,
    cssVarWrapper,
    disableInput
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat, emailAlreadyRegistered, emailAlreadyInvited, invitationClosed, invitationOnly } from './module/message/template/inline';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (getHref() != 'https://featherine.com/special_register' && !DEVELOPMENT) {
        redirect('https://featherine.com/special_register', true);
        return;
    }

    var emailInput = getById('email') as HTMLInputElement;
    var submitButton = getById('submit-button') as HTMLButtonElement;

    addEventListener(emailInput, 'keydown', function (event) {
        if ((event as KeyboardEvent).key === "Enter") {
            register();
        }
    });

    addEventListener(submitButton, 'click', function () {
        register();
    });

    removeClass(getBody(), "hidden");

    async function register() {
        disableAllInputs(true);

        var warningElem = getById('warning');
        var email = emailInput.value;

        if (email == '' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
            warningElem.innerHTML = invalidEmailFormat;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        sendServerRequest('send_invite.php', {
            callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = invalidEmailFormat;
                } else if (response == 'ALREADY REGISTERED') {
                    warningElem.innerHTML = emailAlreadyRegistered;
                } else if (response == 'ALREADY INVITED') {
                    warningElem.innerHTML = emailAlreadyInvited;
                } else if (response == 'CLOSED') {
                    warningElem.innerHTML = invitationClosed;
                } else if (response == 'NORMAL') {
                    warningElem.innerHTML = invitationOnly;
                } else if (response == 'DONE') {
                    showMessage(emailSent);
                    return;
                } else {
                    showMessage();
                    return;
                }
                removeClass(warningElem, 'hidden');
                disableAllInputs(false);
            },
            content: "special=1&receiver=" + encodeURIComponent(email),
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
    }

});