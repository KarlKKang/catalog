import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { createButtonElement, createDivElement, createEmailInput, createParagraphElement, replaceText } from '../module/dom/create_element';
import { disableButton, disableInput } from '../module/dom/change_input';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { invalidEmailFormat, emailAlreadyRegistered } from '../module/text/message/body';
import { expired, emailSent } from '../module/message/param';
import { EMAIL_REGEX } from '../module/regex';
import { buildURLForm } from '../module/http_form';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { submitButtonText } from '../module/text/ui';
import { emailChangePageTitle } from '../module/text/page_title';
import * as styles from '../../css/portal_form.module.scss';

export default function (param: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(emailChangePageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
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
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: param, new: newEmail }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInput(newEmailInput, disabled);
    }
}
