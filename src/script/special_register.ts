import { ServerRequestOptionProp, sendServerRequest } from './module/server';
import { clearSessionStorage } from './module/session_storage/clear';
import { createButtonElement } from './module/dom/element/button/create';
import { createEmailInput } from './module/dom/element/email_input/create';
import { replaceText } from './module/dom/element/text/replace';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createDivElement } from './module/dom/element/div/create';
import { disableButton, disableInput } from './module/dom/change_input';
import { appendChild } from './module/dom/change_node';
import { addClass } from './module/dom/class';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param';
import { invalidEmailFormat, emailAlreadyRegistered, invitationClosed } from './module/text/message/body';
import { EMAIL_REGEX } from './module/regex';
import { buildURLForm } from './module/http_form';
import type { ShowPageFunc } from './module/global';
import { invalidResponse } from './module/server/message';
import { horizontalCenter } from './module/style/horizontal_center';
import { showElement } from './module/style/show_element';
import { hideElement } from './module/style/hide_element';
import { submitButtonText } from './module/text/ui';
import { registerPageTitle } from './module/text/page_title';
import * as styles from '../css/portal_form.module.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage();
    showPageCallback();
}

function showPageCallback() {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(registerPageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [emailContainer, emailInput] = createEmailInput();
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const submitButton = createButtonElement(submitButtonText);
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                if (response === 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                } else if (response === 'ALREADY REGISTERED') {
                    replaceText(warningElem, emailAlreadyRegistered);
                } else if (response === 'CLOSED') {
                    replaceText(warningElem, invitationClosed);
                } else if (response === 'NORMAL') {
                    replaceText(warningElem, '現在、登録は招待制となっています。');
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
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ special: 1, receiver: email }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInput(emailInput, disabled);
    }
}
