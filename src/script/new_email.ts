import {
    TOP_URL,
} from './module/env/constant';
import {
    getURLParam,
} from './module/common';
import { sendServerRequest } from './module/server';
import {
    addEventListener,
    replaceText,
    clearSessionStorage,
    createDivElement,
    appendChild,
    createParagraphElement,
    createEmailInput,
    createButtonElement,
    body,
    disableInput,
} from './module/dom';
import { show as showMessage } from './module/message';
import { invalidEmailFormat, emailAlreadyRegistered } from './module/text/body';
import { expired, emailSent } from './module/message/param';
import { EMAIL_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { submitButtonText } from './module/text/ui';
import { emailChangePageTitle } from './module/text/page_title';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage(() => { showPageCallback('test'); });
        } else {
            redirect(TOP_URL, true);
        }
        return;
    }

    sendServerRequest('verify_email_change', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                showPage(() => { showPageCallback(param); });
            } else {
                showMessage(invalidResponse());
            }
        },
        content: 'p=' + param,
    });
}

function showPageCallback(param: string) {
    const container = createDivElement();
    container.id = 'portal-form';
    appendChild(body, container);

    const title = createParagraphElement(emailChangePageTitle);
    title.id = 'title';
    appendChild(container, title);

    const warningElem = createParagraphElement();
    warningElem.id = 'warning';
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [newEmailContainer, newEmailInput] = createEmailInput('新しいメールアドレス');
    horizontalCenter(newEmailContainer);
    appendChild(container, newEmailContainer);

    const submitButton = createButtonElement(submitButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

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

        sendServerRequest('verify_email_change', {
            callback: function (response: string) {
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'DUPLICATED') {
                    replaceText(warningElem, emailAlreadyRegistered);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'DONE') {
                    showMessage(emailSent());
                } else {
                    showMessage(invalidResponse());
                }
            },
            content: 'p=' + param + '&new=' + newEmail,
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newEmailInput, disabled);
    }
}