import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { appendListItems, createButtonElement, createDivElement, createParagraphElement, createPasswordInput, createUListElement, replaceText } from '../module/dom/create_element';
import { addClass, appendChild, disableInput } from '../module/dom/element';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { invalidPasswordFormat, passwordChanged, passwordConfirmationMismatch } from '../module/text/message/body';
import { expired } from '../module/message/param';
import { PASSWORD_REGEX, buildURLForm } from '../module/common/pure';
import { invalidResponse } from '../module/server/message';
import { hideElement, horizontalCenter, showElement } from '../module/style';
import { passwordResetPageTitle } from '../module/text/page_title';
import { changeButtonText, nextButtonText, passwordRules } from '../module/text/ui';
import * as styles from '../../css/portal_form.module.scss';
import { completed } from '../module/text/message/title';
import { CSS_COLOR } from '../module/style/value';
import { MessageParamKey } from '../module/message/type';
import { LOGIN_URI } from '../module/env/uri';

export default function (user: string, signature: string, expires: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement(passwordResetPageTitle);
    addClass(title, styles.title);
    appendChild(container, title);

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [newPasswordContainer, newPasswordInput] = createPasswordInput(true, '新しいパスワード');
    horizontalCenter(newPasswordContainer);
    appendChild(container, newPasswordContainer);

    const [newPasswordConfirmContainer, newPasswordConfirmInput] = createPasswordInput(true, '確認再入力');
    horizontalCenter(newPasswordConfirmContainer);
    appendChild(container, newPasswordConfirmContainer);

    const submitButton = createButtonElement(changeButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const note = createDivElement();
    addClass(note, styles.note);
    const noteList = createUListElement();
    appendListItems(noteList, ...passwordRules);
    appendChild(note, noteList);
    appendChild(container, note);

    addEventListener(newPasswordInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(newPasswordConfirmInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submitRequest();
        }
    });

    addEventListener(submitButton, 'click', () => {
        submitRequest();
    });

    function submitRequest() {
        disableAllInputs(true);

        const newPassword = newPasswordInput.value;
        const newPasswordConfirm = newPasswordConfirmInput.value;

        if (!PASSWORD_REGEX.test(newPassword)) {
            replaceText(warningElem, invalidPasswordFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (newPassword !== newPasswordConfirm) {
            replaceText(warningElem, passwordConfirmationMismatch);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('reset_password', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'SAME') {
                    replaceText(warningElem, '入力されたパスワードは、元のパスワードと同じです。');
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'PASSWORD INVALID') {
                    replaceText(warningElem, invalidPasswordFormat);
                    showElement(warningElem);
                    disableAllInputs(false);
                } else if (response === 'DONE') {
                    showMessage({
                        [MessageParamKey.TITLE]: completed,
                        [MessageParamKey.MESSAGE]: passwordChanged,
                        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                        [MessageParamKey.URL]: LOGIN_URI,
                        [MessageParamKey.BUTTON_TEXT]: nextButtonText,
                    });
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ user: user, signature: signature, expires: expires, new: newPassword }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(newPasswordInput, disabled);
        disableInput(newPasswordConfirmInput, disabled);
    }
}
