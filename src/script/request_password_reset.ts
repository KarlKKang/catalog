import { ServerRequestOptionKey, sendServerRequest } from './module/server/request';
import { clearSessionStorage } from './module/session_storage/clear';
import { createStyledButtonElement } from './module/dom/element/button/styled/create';
import { createEmailInput } from './module/dom/element/input/email/create';
import { replaceText } from './module/dom/element/text/replace';
import { createParagraphElement } from './module/dom/element/paragraph/create';
import { createSpanElement } from './module/dom/element/span/create';
import { createDivElement } from './module/dom/element/div/create';
import { disableStyledInput } from './module/dom/element/input/disable_styled';
import { disableButton } from './module/dom/element/button/disable';
import { appendChild } from './module/dom/node/append_child';
import { addClass } from './module/dom/class/add';
import { body } from './module/dom/body';
import { addEventListener } from './module/event_listener';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param';
import { invalidEmailFormat } from './module/text/message/body';
import { EMAIL_REGEX } from './module/regex';
import { buildURLForm } from './module/http_form';
import { redirect, type ShowPageFunc } from './module/global';
import { invalidResponse } from './module/server/message';
import { horizontalCenter } from './module/style/horizontal_center';
import { showElement } from './module/style/show_element';
import { hideElement } from './module/style/hide_element';
import { goBackButtonText } from './module/text/button/go_back';
import { submitButtonText } from './module/text/button/submit';
import { passwordResetPageTitle } from './module/text/page_title';
import * as commonStyles from '../css/common.module.scss';
import * as styles from '../css/portal_form.module.scss';
import { LOGIN_URI } from './module/env/uri';
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
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
            [ServerRequestOptionKey.CONTENT]: buildURLForm({ email: email }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableStyledInput(emailStyledInput, disabled);
    }
}
