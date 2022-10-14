// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    disableInput,
    EMAIL_REGEX,
    checkBaseURL
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    getById,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidEmailFormat, emailAlreadyRegistered } from './module/message/template/inline';
import { expired, emailSent } from './module/message/template/param';

addEventListener(w, 'load', function () {
    if (!checkBaseURL(TOP_URL + '/new_email') && !DEVELOPMENT) {
        redirect(TOP_URL, true);
        return;
    }

    clearCookies();

    const newEmailInput = getById('new-email') as HTMLInputElement;
    const submitButton = getById('submit-button') as HTMLButtonElement;

    const param = getURLParam('p');
    const keyID = getURLParam('key-id');
    const signature = getURLParam('signature');


    if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            removeClass(getBody(), "hidden");
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }
    if (keyID == null || !/^[a-zA-Z0-9~_-]+$/.test(keyID)) {
        redirect(TOP_URL, true);
        return;
    }
    if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(TOP_URL, true);
        return;
    }

    sendServerRequest('verify_email_change.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                showMessage(expired);
            } else if (response == 'APPROVED') {
                addEventListener(newEmailInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        submitRequest();
                    }
                });

                addEventListener(submitButton, 'click', function () {
                    submitRequest();
                });
                removeClass(getBody(), "hidden");
            } else {
                showMessage();
            }
        },
        content: "p=" + param + "&key-id=" + keyID + "&signature=" + signature,
        withCredentials: false
    });


    function submitRequest() {
        disableAllInputs(true);

        const warningElem = getById('warning');
        const newEmail = newEmailInput.value;

        if (!EMAIL_REGEX.test(newEmail)) {
            warningElem.innerHTML = invalidEmailFormat;
            removeClass(warningElem, "hidden");
            disableAllInputs(false);
            return;
        }

        sendServerRequest('verify_email_change.php', {
            callback: function (response: string) {
                if (response == 'EXPIRED') {
                    showMessage(expired);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = emailAlreadyRegistered;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = invalidEmailFormat;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage(emailSent(TOP_URL));
                } else {
                    showMessage();
                }
            },
            content: "p=" + param + "&key-id=" + keyID + "&signature=" + signature + "&new=" + newEmail,
            withCredentials: false
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newEmailInput, disabled);
    }
});