import { addClass } from '../../../class/add';
import { button as buttonClass } from '../../../../../../css/button-input_field.module.scss';
import { createNativeButtonElement } from '../native/create';

export function createStyledButtonElement(text?: string) {
    const elem = createNativeButtonElement(text);
    addClass(elem, buttonClass);
    return elem;
}
