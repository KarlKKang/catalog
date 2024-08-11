import { appendChild } from '../../../node/append_child';
import { addClass } from '../../../class/add';
import * as styles from '../../../../../../css/common.module.scss';
import { createDivElement } from '../../div/create';
import { createInputElement } from '../native/create';
import { StyledInputElementKey, type StyledInputElement } from '../type';

export function createTotpInput(allowRecoveryCode: boolean): StyledInputElement {
    const container = createDivElement();
    addClass(container, styles.inputField);
    const input = createInputElement('text');
    input.autocomplete = 'one-time-code';
    input.placeholder = '認証コード';
    input.maxLength = allowRecoveryCode ? 32 : 6;
    appendChild(container, input);
    return {
        [StyledInputElementKey.CONTAINER]: container,
        [StyledInputElementKey.INPUT]: input,
    };
}
