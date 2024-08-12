import { ServerRequestOptionKey, sendServerRequest } from './module/server/request';
import { clearSessionStorage } from './module/session_storage/clear';
import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createEmailInput } from './module/dom/element/input/email/create';
import { replaceText } from './module/dom/element/text/replace';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createDivElement } from './module/dom/element/div/create';
import { disableStyledInput } from './module/dom/element/input/disable_styled';
import { disableButton } from './module/dom/element/button/disable';
import { appendChild } from './module/dom/node/append_child';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param/email_sent';
import { invitationClosed } from './module/text/invitation/closed';
import { emailAlreadyRegistered } from './module/text/email/already_registered';
import { invalidEmailFormat } from './module/text/email/invalid';
import { EMAIL_REGEX } from './module/regex';
import { buildURLForm } from './module/http_form';
import type { ShowPageFunc } from './module/global';
import { invalidResponse } from './module/server/message';
import { horizontalCenter } from './module/style/horizontal_center';
import { showElement } from './module/style/show_element';
import { hideElement } from './module/style/hide_element';
import { submitButtonText } from './module/text/button/submit';
import { registerPageTitle } from './module/text/page_title';
import * as styles from '../css/portal_form.module.scss';
import { StyledInputElementKey } from './module/dom/element/input/type';

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

    const emailStyledInput = createEmailInput();
    const {
        [StyledInputElementKey.CONTAINER]: emailContainer,
        [StyledInputElementKey.INPUT]: emailInput,
    } = emailStyledInput;
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
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
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
            [ServerRequestOptionKey.CONTENT]: buildURLForm({ special: 1, receiver: email }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableStyledInput(emailStyledInput, disabled);
    }
}
