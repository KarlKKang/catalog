import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInputField } from '../module/dom/element/input/input_field/password/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { replaceText } from '../module/dom/element/text/replace';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { passwordChanged } from '../module/text/password/changed';
import { passwordConfirmationMismatch } from '../module/text/password/mismatch';
import { invalidPasswordFormat } from '../module/text/password/invalid';
import { expired } from '../module/message/param/expired';
import { testPassword } from '../module/regex/password';
import { buildHttpForm } from '../module/string/http_form/build';
import { invalidResponse } from '../module/message/param/invalid_response';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { passwordResetPageTitle } from '../module/text/page_title';
import { passwordRule } from '../module/text/password/rule';
import { changeButtonText } from '../module/text/button/change';
import * as styles from '../../css/portal_form.module.scss';
import { completedTitle } from '../module/text/misc/completed_title';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';

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

    const newPasswordInputField = createPasswordInputField(true, '新しいパスワード');
    const {
        [InputFieldElementKey.CONTAINER]: newPasswordContainer,
        [InputFieldElementKey.INPUT]: newPasswordInput,
    } = newPasswordInputField;
    horizontalCenter(newPasswordContainer);
    appendChild(container, newPasswordContainer);

    const newPasswordConfirmInputField = createPasswordInputField(true, '確認再入力');
    const {
        [InputFieldElementKey.CONTAINER]: newPasswordConfirmContainer,
        [InputFieldElementKey.INPUT]: newPasswordConfirmInput,
    } = newPasswordConfirmInputField;
    horizontalCenter(newPasswordConfirmContainer);
    appendChild(container, newPasswordConfirmContainer);

    const submitButton = createStyledButtonElement(changeButtonText);
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const note = createDivElement();
    addClass(note, styles.note);
    const noteList = createUListElement();
    appendListItems(noteList, ...passwordRule);
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

        if (!testPassword(newPassword)) {
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
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
                        [MessageParamKey.TITLE]: completedTitle,
                        [MessageParamKey.MESSAGE]: passwordChanged,
                        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                        [MessageParamKey.BUTTON]: null,
                    });
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionKey.CONTENT]: buildHttpForm({ user: user, signature: signature, expires: expires, new: newPassword }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInputField(newPasswordInputField, disabled);
        disableInputField(newPasswordConfirmInputField, disabled);
    }
}
