import { appendChild } from '../../../change_node';
import { addClass } from '../../../class';
import { createInputElement } from '../native/create';
import { createDivElement } from '../../div/create';
import * as styles from '../../../../../../css/common.module.scss';
import { addAutoMultiLanguageClass } from '../../../../style/multi_language/auto';

export function createUsernameInput() {
    const container = createDivElement();
    addClass(container, styles.inputField);
    addAutoMultiLanguageClass(container);
    const input = createInputElement('text');
    input.autocomplete = 'username';
    input.placeholder = 'ユーザー名';
    input.autocapitalize = 'off';
    input.maxLength = 16;
    appendChild(container, input);
    return [container, input] as const;
}
