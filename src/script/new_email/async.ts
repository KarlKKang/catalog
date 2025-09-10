import { APIRequestOptionKey, sendAPIRequest } from '../module/api/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createEmailInputField } from '../module/dom/element/input/input_field/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { emailAlreadyRegistered } from '../module/text/email/already_registered';
import { invalidEmailFormat } from '../module/text/email/invalid';
import { emailSent } from '../module/message/param/email_sent';
import { expired } from '../module/message/param/expired';
import { testEmail } from '../module/regex/email';
import { buildHttpForm } from '../module/string/http_form/build';
import { invalidResponse } from '../module/message/param/invalid_response';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { submitButtonText } from '../module/text/button/submit';
import { emailChangePageTitle } from '../module/text/page_title';
import * as styles from '../../css/portal_form.module.scss';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';

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

    const newEmailInputField = createEmailInputField('新しいメールアドレス');
    const {
        [InputFieldElementKey.CONTAINER]: newEmailContainer,
        [InputFieldElementKey.INPUT]: newEmailInput,
    } = newEmailInputField;
    horizontalCenter(newEmailContainer);
    appendChild(container, newEmailContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
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

        if (!testEmail(newEmail)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendAPIRequest('verify_email_change', {
            [APIRequestOptionKey.CALLBACK]: function (response: string) {
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
                    showMessage(invalidResponse(true));
                }
            },
            [APIRequestOptionKey.CONTENT]: buildHttpForm({ p: param, new: newEmail }),
            [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: true,
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInputField(newEmailInputField, disabled);
    }
}
