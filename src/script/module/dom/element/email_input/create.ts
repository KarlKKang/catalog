import { appendChild } from '../../change_node';
import { addClass } from '../../class';
import * as styles from '../../../../../css/common.module.scss';
import { createDivElement } from '../div/create';
import { createInputElement } from '../input/create';

export function createEmailInput(placeholder = 'メールアドレス') {
    const container = createDivElement();
    addClass(container, styles.inputField);
    const input = createInputElement('email');
    input.autocomplete = 'email';
    input.placeholder = placeholder;
    input.autocapitalize = 'off';
    input.maxLength = 254;
    appendChild(container, input);
    return [container, input] as const;
}
