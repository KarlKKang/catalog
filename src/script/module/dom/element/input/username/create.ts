import { appendChild } from '../../../node/append_child';
import { addClass } from '../../../class/add';
import { createInputElement } from '../native/create';
import { createDivElement } from '../../div/create';
import * as styles from '../../../../../../css/common.module.scss';
import { addAutoMultiLanguageClass } from '../../../../style/multi_language/auto';
import { StyledInputElementKey, type StyledInputElement } from '../type';

export function createUsernameInput(): StyledInputElement {
    const container = createDivElement();
    addClass(container, styles.inputField);
    addAutoMultiLanguageClass(container);
    const input = createInputElement('text');
    input.autocomplete = 'username';
    input.placeholder = 'ユーザー名';
    input.autocapitalize = 'off';
    input.maxLength = 16;
    appendChild(container, input);
    return {
        [StyledInputElementKey.CONTAINER]: container,
        [StyledInputElementKey.INPUT]: input,
    };
}
