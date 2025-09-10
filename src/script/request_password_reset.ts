import { APIRequestOptionKey, sendAPIRequest } from './module/api/request';
import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createEmailInputField } from './module/dom/element/input/input_field/email/create';
import { replaceText } from './module/dom/element/text/replace';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createSpanElement } from './module/dom/element/span/create';
import { createDivElement } from './module/dom/element/div/create';
import { disableInputField } from './module/dom/element/input/input_field/disable';
import { disableButton } from './module/dom/element/button/disable';
import { appendChild } from './module/dom/node/append_child';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener/add';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param/email_sent';
import { invalidEmailFormat } from './module/text/email/invalid';
import { testEmail } from './module/regex/email';
import { buildHttpForm } from './module/string/http_form/build';
import { type ShowPageFunc } from './module/global/type';
import { redirectSameOrigin } from './module/global/redirect';
import { invalidResponse } from './module/message/param/invalid_response';
import { horizontalCenter } from './module/style/horizontal_center';
import { showElement } from './module/style/show_element';
import { hideElement } from './module/style/hide_element';
import { goBackButtonText } from './module/text/button/go_back';
import { submitButtonText } from './module/text/button/submit';
import { passwordResetPageTitle } from './module/text/page_title';
import { link as linkClass } from '../css/link.module.scss';
import * as styles from '../css/portal_form.module.scss';
import { TOP_URI } from './module/env/uri';
import { InputFieldElementKey } from './module/dom/element/input/input_field/type';
import { getSearchParam } from './module/dom/location/get/search_param';
import { appendText } from './module/dom/element/text/append';
import { closeButtonText } from './module/text/button/close';
import { closeWindow } from './module/dom/window/close';

export default function (showPage: ShowPageFunc) {
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

    const emailInputField = createEmailInputField();
    const {
        [InputFieldElementKey.CONTAINER]: emailContainer,
        [InputFieldElementKey.INPUT]: emailInput,
    } = emailInputField;
    horizontalCenter(emailContainer);
    appendChild(container, emailContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const backURL = getSearchParam('back-url');
    const goBack = createParagraphElement();
    const goBackText = createSpanElement();
    if (backURL === null) {
        appendText(goBackText, '×　' + closeButtonText);
        addEventListener(goBackText, 'click', () => {
            closeWindow(TOP_URI);
        });
    } else {
        appendText(goBackText, '〈　' + goBackButtonText);
        addEventListener(goBackText, 'click', () => {
            redirectSameOrigin(backURL);
        });
    }
    addClass(goBackText, linkClass);
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

    function submitRequest() {
        disableAllInputs(true);

        const email = emailInput.value;
        if (!testEmail(email)) {
            replaceText(warningElem, invalidEmailFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendAPIRequest('send_password_reset', {
            [APIRequestOptionKey.CALLBACK]: function (response: string) {
                if (response === 'INVALID FORMAT') {
                    replaceText(warningElem, invalidEmailFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'DONE') {
                    showMessage(emailSent(backURL ?? undefined));
                } else {
                    showMessage(invalidResponse(backURL === null ? true : undefined));
                }
            },
            [APIRequestOptionKey.CONTENT]: buildHttpForm({ email: email }),
            ...backURL === null && { [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: true },
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInputField(emailInputField, disabled);
    }
}
