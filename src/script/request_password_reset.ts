import {
    LOGIN_URL,
} from './module/env/constant';
import { ServerRequestOptionProp, sendServerRequest } from './module/server';
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
    createSpanElement,
    addClass,
} from './module/dom';
import { showMessage } from './module/message';
import { emailSent } from './module/message/param';
import { invalidEmailFormat } from './module/text/message/body';
import { EMAIL_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { submitButtonText } from './module/text/ui';
import { passwordResetPageTitle } from './module/text/page_title';
import * as commonStyles from '../css/common.module.scss';
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
    const goBackText = createSpanElement('❮　戻る');
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
        redirect(LOGIN_URL, true);
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
                    showMessage(emailSent(LOGIN_URL));
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: 'email=' + encodeURIComponent(email),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(emailInput, disabled);
    }
}