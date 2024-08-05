import * as styles from '../../../css/common.module.scss';
import { addClass, removeClass } from './class';
import { getParentElement } from './get_element';

export function disableInput(inputElement: HTMLInputElement, disabled: boolean) {
    inputElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(inputElement), styles.disabled);
    } else {
        removeClass(getParentElement(inputElement), styles.disabled);
    }
}

export function disableButton(buttonElement: HTMLButtonElement, disabled: boolean) {
    buttonElement.disabled = disabled;
}
