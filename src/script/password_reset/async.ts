import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInput } from '../module/dom/element/input/password/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { replaceText } from '../module/dom/element/text/replace';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableStyledInput } from '../module/dom/element/input/disable_styled';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { invalidPasswordFormat, passwordChanged, passwordConfirmationMismatch } from '../module/text/message/body';
import { expired } from '../module/message/param';
import { PASSWORD_REGEX } from '../module/regex';
import { buildURLForm } from '../module/http_form';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { passwordResetPageTitle } from '../module/text/page_title';
import { changeButtonText, nextButtonText, passwordRules } from '../module/text/ui';
import * as styles from '../../css/portal_form.module.scss';
import { completed } from '../module/text/message/title';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { LOGIN_URI } from '../module/env/uri';
import { StyledInputElementKey } from '../module/dom/element/input/type';

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

    const newPasswordStyledInput = createPasswordInput(true, '新しいパスワード');
    const {
        [StyledInputElementKey.CONTAINER]: newPasswordContainer,
        [StyledInputElementKey.INPUT]: newPasswordInput,
    } = newPasswordStyledInput;
    horizontalCenter(newPasswordContainer);
    appendChild(container, newPasswordContainer);

    const newPasswordConfirmStyledInput = createPasswordInput(true, '確認再入力');
    const {
        [StyledInputElementKey.CONTAINER]: newPasswordConfirmContainer,
        [StyledInputElementKey.INPUT]: newPasswordConfirmInput,
    } = newPasswordConfirmStyledInput;
    horizontalCenter(newPasswordConfirmContainer);
    appendChild(container, newPasswordConfirmContainer);

    const submitButton = createStyledButtonElement(changeButtonText);
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
            [ServerRequestOptionKey.CONTENT]: buildURLForm({ user: user, signature: signature, expires: expires, new: newPassword }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableStyledInput(newPasswordStyledInput, disabled);
        disableStyledInput(newPasswordConfirmStyledInput, disabled);
    }
}
