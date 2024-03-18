import { sendServerRequest } from './module/server_request';
import {
    addEventListener,
    replaceText,
    clearSessionStorage,
    disableInput,
    createDivElement,
    appendChild,
    body,
    createParagraphElement,
    createEmailInput,
    createButtonElement,
} from './module/dom';
import { show as showMessage } from './module/message';
import { emailSent } from './module/message/template/param';
import { invalidEmailFormat, emailAlreadyRegistered, invitationClosed, invitationOnly } from './module/message/template/inline';
import { EMAIL_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { invalidResponse } from './module/message/template/param/server';
import { hideElement, horizontalCenter, showElement } from './module/style';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage(() => { showPageCallback(); });
}

function showPageCallback() {
    const container = createDivElement();
    container.id = 'portal-form';
    appendChild(body, container);

    const title = createParagraphElement('新規登録');
    title.id = 'title';
    appendChild(container, title);

    const warningElem = createParagraphElement();
    warningElem.id = 'warning';
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [emailContainer, emailInput] = createEmailInput();
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const submitButton = createButtonElement('送信する');
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    addEventListener(emailInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });

    addEventListener(submitButton, 'click', () => {
        register();
    });

    function register() {
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
                if (response === 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                } else if (response === 'ALREADY REGISTERED') {
                    replaceText(warningElem, emailAlreadyRegistered);
                } else if (response === 'CLOSED') {
                    replaceText(warningElem, invitationClosed);
                } else if (response === 'NORMAL') {
                    replaceText(warningElem, invitationOnly);
                } else if (response === 'DONE') {
                    showMessage(emailSent());
                    return;
                } else {
                    showMessage(invalidResponse());
                    return;
                }
                showElement(warningElem);
                disableAllInputs(false);
            },
            content: 'special=1&receiver=' + encodeURIComponent(email),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
    }
}