import { appendChild } from '../change_node';
import { addClass } from '../class';
import { createInputElement } from './input/create';
import { createDivElement } from './div/create';
import { container as autoContainerClass } from '../../../../css/multi_language/auto.module.scss';
import { container as manualContainerClass } from '../../../../css/multi_language/manual.module.scss';
import * as styles from '../../../../css/common.module.scss';

export function createUsernameInput() {
    const container = createDivElement();
    addClass(container, styles.inputField);
    addClass(container, autoContainerClass);
    const input = createInputElement('text');
    input.autocomplete = 'username';
    input.placeholder = 'ユーザー名';
    input.autocapitalize = 'off';
    input.maxLength = 16;
    appendChild(container, input);
    return [container, input] as const;
}

export function addAutoMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, autoContainerClass);
}

export function addManualMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, manualContainerClass);
}
