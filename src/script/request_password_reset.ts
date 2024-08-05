import { ServerRequestOptionProp, sendServerRequest } from './module/server';
import { clearSessionStorage } from './module/dom/session_storage';
import { createButtonElement, createDivElement, createEmailInput, createParagraphElement, createSpanElement, replaceText } from './module/dom/create_element';
import { disableButton, disableInput } from './module/dom/change_input';
import { appendChild } from './module/dom/change_node';
import { addClass } from './module/dom/class';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param';
import { invalidEmailFormat } from './module/text/message/body';
import { EMAIL_REGEX } from './module/regex';
import { buildURLForm } from './module/http_form';
import { redirect, type ShowPageFunc } from './module/global';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { goBackButtonText, submitButtonText } from './module/text/ui';
import { passwordResetPageTitle } from './module/text/page_title';
import * as commonStyles from '../css/common.module.scss';
import * as styles from '../css/portal_form.module.scss';
import { LOGIN_URI } from './module/env/uri';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    showPage();
    showPageCallback();
}

function showPageCallback() {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(passwordResetPageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const note = createParagraphElement('登録されているメールアドレスを入力してください。');
    addClass(note, styles.note);
    appendChild(container, note);

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

    const goBack = createParagraphElement();
    const goBackText = createSpanElement('❮　' + goBackButtonText);
    addClass(goBack, commonStyles.link);
    appendChild(goBack, goBackText);
    appendChild(container, goBack);

    addEventListener(emailInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(submitButton, 'click', () => {
        submitRequest();
    });

    addEventListener(goBackText, 'click', () => {
        redirect(LOGIN_URI, true);
    });

    function submitRequest() {
        disableAllInputs(true);

        const email = emailInput.value;
        if (!EMAIL_REGEX.test(email)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('send_password_reset', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                if (response === 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'DONE') {
                    showMessage(emailSent(LOGIN_URI));
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ email: email }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInput(emailInput, disabled);
    }
}
