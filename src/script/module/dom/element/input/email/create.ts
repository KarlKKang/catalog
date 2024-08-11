import { appendChild } from '../../../node/append_child';
import { addClass } from '../../../class/add';
import * as styles from '../../../../../../css/common.module.scss';
import { createDivElement } from '../../div/create';
import { createInputElement } from '../native/create';
import { StyledInputElementKey, type StyledInputElement } from '../type';

export function createEmailInput(placeholder = 'メールアドレス'): StyledInputElement {
    const container = createDivElement();
    addClass(container, styles.inputField);
    const input = createInputElement('email');
    input.autocomplete = 'email';
    input.placeholder = placeholder;
    input.autocapitalize = 'off';
    input.maxLength = 254;
    appendChild(container, input);
    return {
        [StyledInputElementKey.CONTAINER]: container,
        [StyledInputElementKey.INPUT]: input,
    };
}
