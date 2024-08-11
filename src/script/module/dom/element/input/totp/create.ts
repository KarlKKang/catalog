import { appendChild } from '../../../change_node';
import { addClass } from '../../../class';
import * as styles from '../../../../../../css/common.module.scss';
import { createDivElement } from '../../div/create';
import { createInputElement } from '../native/create';

export function createTotpInput(allowRecoveryCode: boolean) {
    const container = createDivElement();
    addClass(container, styles.inputField);
    const input = createInputElement('text');
    input.autocomplete = 'one-time-code';
    input.placeholder = '認証コード';
    input.maxLength = allowRecoveryCode ? 32 : 6;
    appendChild(container, input);
    return [container, input] as const;
}
