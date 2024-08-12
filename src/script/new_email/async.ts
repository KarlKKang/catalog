import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createEmailInput } from '../module/dom/element/input/email/create';
import { replaceText } from '../module/dom/element/text/replace';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableStyledInput } from '../module/dom/element/input/disable_styled';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { emailAlreadyRegistered } from '../module/text/email/already_registered';
import { invalidEmailFormat } from '../module/text/email/invalid';
import { expired, emailSent } from '../module/message/param';
import { EMAIL_REGEX } from '../module/regex';
import { buildURLForm } from '../module/http_form';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { submitButtonText } from '../module/text/button/submit';
import { emailChangePageTitle } from '../module/text/page_title';
import * as styles from '../../css/portal_form.module.scss';
import { StyledInputElementKey } from '../module/dom/element/input/type';

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

    const newEmailStyledInput = createEmailInput('新しいメールアドレス');
    const {
        [StyledInputElementKey.CONTAINER]: newEmailContainer,
        [StyledInputElementKey.INPUT]: newEmailInput,
    } = newEmailStyledInput;
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

        if (!EMAIL_REGEX.test(newEmail)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('verify_email_change', {
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
            [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: param, new: newEmail }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableStyledInput(newEmailStyledInput, disabled);
    }
}
